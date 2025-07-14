const { supabase } = require('../config/database');
const { ROLES, ORDER_STATUSES, PAYMENT_STATUSES } = require('../config/constants');

// Получить все заказы магазина
const getOrders = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { 
      status, 
      payment_status, 
      page = 1, 
      limit = 20, 
      sort_by = 'created_at', 
      sort_order = 'desc',
      date_from,
      date_to
    } = req.query;

    // Проверяем права доступа
    if (req.user.role !== ROLES.ADMIN) {
      const { data: store } = await supabase
        .from('stores')
        .select('owner_id')
        .eq('id', storeId)
        .single();

      if (!store || store.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Нет прав для просмотра заказов этого магазина' });
      }
    }

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          price,
          products (
            id,
            name,
            images
          )
        ),
        payments (
          id,
          amount,
          status,
          payment_method,
          created_at
        ),
        users (
          id,
          telegram_username,
          first_name,
          last_name
        )
      `, { count: 'exact' })
      .eq('store_id', storeId);

    // Фильтры
    if (status) {
      query = query.eq('status', status);
    }
    if (payment_status) {
      query = query.eq('payment_status', payment_status);
    }
    if (date_from) {
      query = query.gte('created_at', date_from);
    }
    if (date_to) {
      query = query.lte('created_at', date_to);
    }

    // Сортировка
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Пагинация
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ error: 'Ошибка при получении заказов' });
    }

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error in getOrders:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Получить заказ по ID
const getOrder = async (req, res) => {
  try {
    const { storeId, orderId } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          price,
          products (
            id,
            name,
            images,
            sku
          )
        ),
        payments (
          id,
          amount,
          status,
          payment_method,
          transaction_id,
          created_at,
          updated_at
        ),
        users (
          id,
          telegram_id,
          telegram_username,
          first_name,
          last_name,
          phone
        ),
        stores (
          id,
          name,
          owner_id
        )
      `)
      .eq('id', orderId)
      .eq('store_id', storeId)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    // Проверяем права доступа
    if (req.user.role !== ROLES.ADMIN && 
        order.stores.owner_id !== req.user.id && 
        order.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет прав для просмотра этого заказа' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error in getOrder:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Создать новый заказ
const createOrder = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { 
      items, 
      customer_info, 
      delivery_address, 
      delivery_method = 'pickup',
      notes 
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Корзина пуста' });
    }

    // Получаем информацию о товарах
    const productIds = items.map(item => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, stock_quantity, is_active')
      .in('id', productIds)
      .eq('store_id', storeId);

    if (productsError || !products) {
      return res.status(500).json({ error: 'Ошибка при получении информации о товарах' });
    }

    // Проверяем наличие товаров
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      
      if (!product) {
        return res.status(400).json({ error: `Товар с ID ${item.product_id} не найден` });
      }

      if (!product.is_active) {
        return res.status(400).json({ error: `Товар "${product.name}" недоступен` });
      }

      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({ 
          error: `Недостаточно товара "${product.name}" на складе. Доступно: ${product.stock_quantity}` 
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Создаем заказ
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        store_id: storeId,
        customer_id: req.user.id,
        total_amount: totalAmount,
        status: ORDER_STATUSES.PENDING,
        payment_status: PAYMENT_STATUSES.PENDING,
        customer_info,
        delivery_address,
        delivery_method,
        notes
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return res.status(500).json({ error: 'Ошибка при создании заказа' });
    }

    // Создаем позиции заказа
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Откатываем создание заказа
      await supabase.from('orders').delete().eq('id', order.id);
      return res.status(500).json({ error: 'Ошибка при создании позиций заказа' });
    }

    // Обновляем количество товаров на складе
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      await supabase
        .from('products')
        .update({ 
          stock_quantity: product.stock_quantity - item.quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.product_id);
    }

    // Получаем полную информацию о созданном заказе
    const { data: fullOrder } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          price,
          products (
            id,
            name,
            images
          )
        )
      `)
      .eq('id', order.id)
      .single();

    res.status(201).json(fullOrder);
  } catch (error) {
    console.error('Error in createOrder:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Обновить статус заказа
const updateOrderStatus = async (req, res) => {
  try {
    const { storeId, orderId } = req.params;
    const { status, notes } = req.body;

    // Проверяем права доступа
    if (req.user.role !== ROLES.ADMIN) {
      const { data: store } = await supabase
        .from('stores')
        .select('owner_id')
        .eq('id', storeId)
        .single();

      if (!store || store.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Нет прав для изменения статуса заказа' });
      }
    }

    const updates = {
      status,
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updates.notes = notes;
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .eq('store_id', storeId)
      .select(`
        *,
        users (
          telegram_id,
          first_name
        ),
        stores (
          name
        )
      `)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    // TODO: Отправить уведомление покупателю в Telegram
    // await sendOrderStatusNotification(order);

    res.json(order);
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Отменить заказ
const cancelOrder = async (req, res) => {
  try {
    const { storeId, orderId } = req.params;
    const { reason } = req.body;

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          product_id,
          quantity
        ),
        stores (
          owner_id
        )
      `)
      .eq('id', orderId)
      .eq('store_id', storeId)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    // Проверяем права доступа
    if (req.user.role !== ROLES.ADMIN && 
        order.stores.owner_id !== req.user.id && 
        order.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет прав для отмены этого заказа' });
    }

    // Проверяем, можно ли отменить заказ
    if (order.status === ORDER_STATUSES.DELIVERED || 
        order.status === ORDER_STATUSES.CANCELLED) {
      return res.status(400).json({ error: 'Нельзя отменить доставленный или уже отмененный заказ' });
    }

    // Обновляем статус заказа
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: ORDER_STATUSES.CANCELLED,
        payment_status: PAYMENT_STATUSES.CANCELLED,
        notes: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: 'Ошибка при отмене заказа' });
    }

    // Возвращаем товары на склад
    for (const item of order.order_items) {
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single();

      if (product) {
        await supabase
          .from('products')
          .update({ 
            stock_quantity: product.stock_quantity + item.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.product_id);
      }
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error in cancelOrder:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Получить статистику заказов
const getOrderStats = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { period = '30d' } = req.query;

    // Проверяем права доступа
    if (req.user.role !== ROLES.ADMIN) {
      const { data: store } = await supabase
        .from('stores')
        .select('owner_id')
        .eq('id', storeId)
        .single();

      if (!store || store.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Нет прав для просмотра статистики' });
      }
    }

    // Определяем период
    const now = new Date();
    let dateFrom;
    
    switch (period) {
      case '7d':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const { data: orders } = await supabase
      .from('orders')
      .select('id, total_amount, status, payment_status, created_at')
      .eq('store_id', storeId)
      .gte('created_at', dateFrom.toISOString());

    const stats = {
      total_orders: orders.length,
      total_revenue: orders.reduce((sum, order) => sum + order.total_amount, 0),
      pending_orders: orders.filter(o => o.status === ORDER_STATUSES.PENDING).length,
      processing_orders: orders.filter(o => o.status === ORDER_STATUSES.PROCESSING).length,
      shipped_orders: orders.filter(o => o.status === ORDER_STATUSES.SHIPPED).length,
      delivered_orders: orders.filter(o => o.status === ORDER_STATUSES.DELIVERED).length,
      cancelled_orders: orders.filter(o => o.status === ORDER_STATUSES.CANCELLED).length,
      paid_orders: orders.filter(o => o.payment_status === PAYMENT_STATUSES.PAID).length,
      average_order_value: orders.length > 0 ? orders.reduce((sum, order) => sum + order.total_amount, 0) / orders.length : 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error in getOrderStats:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

module.exports = {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats
};

