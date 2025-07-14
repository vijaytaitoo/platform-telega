const { supabase } = require('../config/database');
const { ROLES } = require('../config/constants');

// Получить все товары магазина
const getProducts = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { category_id, search, page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc' } = req.query;

    let query = supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name,
          slug
        ),
        stores (
          id,
          name,
          slug
        )
      `)
      .eq('store_id', storeId)
      .eq('is_active', true);

    // Фильтр по категории
    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    // Поиск по названию и описанию
    if (search) {
      query = query.or(`name.ilike.%${search}%, description.ilike.%${search}%`);
    }

    // Сортировка
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Пагинация
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ error: 'Ошибка при получении товаров' });
    }

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error in getProducts:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Получить товар по ID
const getProduct = async (req, res) => {
  try {
    const { storeId, productId } = req.params;

    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name,
          slug
        ),
        stores (
          id,
          name,
          slug,
          owner_id
        )
      `)
      .eq('id', productId)
      .eq('store_id', storeId)
      .single();

    if (error || !product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error in getProduct:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Создать новый товар
const createProduct = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { name, description, price, category_id, images, sku, stock_quantity, weight, dimensions } = req.body;

    // Проверяем права доступа
    if (req.user.role !== ROLES.ADMIN) {
      const { data: store } = await supabase
        .from('stores')
        .select('owner_id')
        .eq('id', storeId)
        .single();

      if (!store || store.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Нет прав для создания товара в этом магазине' });
      }
    }

    // Создаем slug из названия
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9а-я]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        store_id: storeId,
        name,
        description,
        price,
        category_id,
        images: images || [],
        sku,
        stock_quantity: stock_quantity || 0,
        weight,
        dimensions,
        slug,
        is_active: true
      })
      .select(`
        *,
        categories (
          id,
          name,
          slug
        ),
        stores (
          id,
          name,
          slug
        )
      `)
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return res.status(500).json({ error: 'Ошибка при создании товара' });
    }

    res.status(201).json(product);
  } catch (error) {
    console.error('Error in createProduct:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Обновить товар
const updateProduct = async (req, res) => {
  try {
    const { storeId, productId } = req.params;
    const updates = req.body;

    // Проверяем права доступа
    if (req.user.role !== ROLES.ADMIN) {
      const { data: store } = await supabase
        .from('stores')
        .select('owner_id')
        .eq('id', storeId)
        .single();

      if (!store || store.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Нет прав для редактирования товара в этом магазине' });
      }
    }

    // Обновляем slug если изменилось название
    if (updates.name) {
      updates.slug = updates.name.toLowerCase()
        .replace(/[^a-z0-9а-я]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    updates.updated_at = new Date().toISOString();

    const { data: product, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .eq('store_id', storeId)
      .select(`
        *,
        categories (
          id,
          name,
          slug
        ),
        stores (
          id,
          name,
          slug
        )
      `)
      .single();

    if (error || !product) {
      console.error('Error updating product:', error);
      return res.status(404).json({ error: 'Товар не найден или ошибка при обновлении' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error in updateProduct:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Удалить товар
const deleteProduct = async (req, res) => {
  try {
    const { storeId, productId } = req.params;

    // Проверяем права доступа
    if (req.user.role !== ROLES.ADMIN) {
      const { data: store } = await supabase
        .from('stores')
        .select('owner_id')
        .eq('id', storeId)
        .single();

      if (!store || store.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Нет прав для удаления товара в этом магазине' });
      }
    }

    // Мягкое удаление - помечаем как неактивный
    const { data: product, error } = await supabase
      .from('products')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .eq('store_id', storeId)
      .select()
      .single();

    if (error || !product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    res.json({ message: 'Товар успешно удален' });
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Получить статистику товаров магазина
const getProductStats = async (req, res) => {
  try {
    const { storeId } = req.params;

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

    // Общая статистика товаров
    const { data: totalStats } = await supabase
      .from('products')
      .select('id, is_active, stock_quantity, price')
      .eq('store_id', storeId);

    const stats = {
      total_products: totalStats.length,
      active_products: totalStats.filter(p => p.is_active).length,
      inactive_products: totalStats.filter(p => !p.is_active).length,
      out_of_stock: totalStats.filter(p => p.stock_quantity === 0).length,
      low_stock: totalStats.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length,
      total_value: totalStats.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0)
    };

    // Статистика по категориям
    const { data: categoryStats } = await supabase
      .from('products')
      .select(`
        category_id,
        categories (name),
        id
      `)
      .eq('store_id', storeId)
      .eq('is_active', true);

    const categoriesCount = {};
    categoryStats.forEach(product => {
      const categoryName = product.categories?.name || 'Без категории';
      categoriesCount[categoryName] = (categoriesCount[categoryName] || 0) + 1;
    });

    res.json({
      ...stats,
      categories: categoriesCount
    });
  } catch (error) {
    console.error('Error in getProductStats:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats
};

