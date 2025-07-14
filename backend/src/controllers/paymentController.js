const { supabase } = require('../config/database');
const { ROLES, PAYMENT_STATUSES, ORDER_STATUSES } = require('../config/constants');
const crypto = require('crypto');

// Создать платеж для заказа
const createPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { payment_method } = req.body;

    // Получаем информацию о заказе
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        stores (
          id,
          name,
          owner_id,
          payment_settings
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    // Проверяем права доступа
    if (req.user.role !== ROLES.ADMIN && order.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет прав для создания платежа по этому заказу' });
    }

    // Проверяем, что заказ можно оплатить
    if (order.payment_status === PAYMENT_STATUSES.PAID) {
      return res.status(400).json({ error: 'Заказ уже оплачен' });
    }

    if (order.status === ORDER_STATUSES.CANCELLED) {
      return res.status(400).json({ error: 'Нельзя оплатить отмененный заказ' });
    }

    // Создаем запись о платеже
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        amount: order.total_amount,
        payment_method,
        status: PAYMENT_STATUSES.PENDING,
        transaction_id: generateTransactionId()
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      return res.status(500).json({ error: 'Ошибка при создании платежа' });
    }

    // Генерируем ссылку для оплаты в зависимости от метода
    let paymentUrl = null;
    let paymentData = {};

    switch (payment_method) {
      case 'click':
        paymentData = await generateClickPayment(payment, order);
        paymentUrl = paymentData.payment_url;
        break;
      case 'payme':
        paymentData = await generatePaymePayment(payment, order);
        paymentUrl = paymentData.payment_url;
        break;
      case 'telegram':
        paymentData = await generateTelegramPayment(payment, order);
        paymentUrl = paymentData.payment_url;
        break;
      default:
        return res.status(400).json({ error: 'Неподдерживаемый метод оплаты' });
    }

    // Обновляем платеж с данными провайдера
    await supabase
      .from('payments')
      .update({
        provider_payment_id: paymentData.provider_payment_id,
        payment_url: paymentUrl,
        provider_data: paymentData
      })
      .eq('id', payment.id);

    res.status(201).json({
      ...payment,
      payment_url: paymentUrl,
      provider_data: paymentData
    });
  } catch (error) {
    console.error('Error in createPayment:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Получить статус платежа
const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        orders (
          id,
          customer_id,
          stores (
            owner_id
          )
        )
      `)
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      return res.status(404).json({ error: 'Платеж не найден' });
    }

    // Проверяем права доступа
    if (req.user.role !== ROLES.ADMIN && 
        payment.orders.customer_id !== req.user.id && 
        payment.orders.stores.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет прав для просмотра этого платежа' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error in getPaymentStatus:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Обработка вебхука от Click
const handleClickWebhook = async (req, res) => {
  try {
    const { click_trans_id, service_id, click_paydoc_id, merchant_trans_id, amount, action, error, error_note, sign_time, sign_string } = req.body;

    // Проверяем подпись
    const expectedSign = generateClickSignature(req.body);
    if (sign_string !== expectedSign) {
      return res.status(400).json({ error: -1, error_note: 'Invalid signature' });
    }

    // Находим платеж по transaction_id
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        orders (
          id,
          store_id
        )
      `)
      .eq('transaction_id', merchant_trans_id)
      .single();

    if (paymentError || !payment) {
      return res.status(400).json({ error: -5, error_note: 'Transaction not found' });
    }

    let newStatus = payment.status;
    let orderStatus = null;

    switch (action) {
      case 0: // Подготовка платежа
        if (error === 0) {
          newStatus = PAYMENT_STATUSES.PROCESSING;
        } else {
          newStatus = PAYMENT_STATUSES.FAILED;
        }
        break;
      case 1: // Завершение платежа
        if (error === 0) {
          newStatus = PAYMENT_STATUSES.PAID;
          orderStatus = ORDER_STATUSES.PROCESSING;
        } else {
          newStatus = PAYMENT_STATUSES.FAILED;
        }
        break;
    }

    // Обновляем статус платежа
    await supabase
      .from('payments')
      .update({
        status: newStatus,
        provider_payment_id: click_trans_id,
        provider_data: { ...payment.provider_data, webhook_data: req.body },
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id);

    // Обновляем статус заказа если нужно
    if (orderStatus) {
      await supabase
        .from('orders')
        .update({
          payment_status: PAYMENT_STATUSES.PAID,
          status: orderStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.orders.id);
    }

    res.json({ error: 0, error_note: 'Success' });
  } catch (error) {
    console.error('Error in handleClickWebhook:', error);
    res.status(500).json({ error: -1, error_note: 'Internal server error' });
  }
};

// Обработка вебхука от Payme
const handlePaymeWebhook = async (req, res) => {
  try {
    const { method, params } = req.body;

    switch (method) {
      case 'CheckPerformTransaction':
        return await handlePaymeCheckTransaction(params, res);
      case 'CreateTransaction':
        return await handlePaymeCreateTransaction(params, res);
      case 'PerformTransaction':
        return await handlePaymePerformTransaction(params, res);
      case 'CancelTransaction':
        return await handlePaymeCancelTransaction(params, res);
      case 'CheckTransaction':
        return await handlePaymeCheckTransactionStatus(params, res);
      default:
        return res.status(400).json({ error: { code: -32601, message: 'Method not found' } });
    }
  } catch (error) {
    console.error('Error in handlePaymeWebhook:', error);
    res.status(500).json({ error: { code: -32603, message: 'Internal error' } });
  }
};

// Обработка вебхука от Telegram Payments
const handleTelegramPaymentWebhook = async (req, res) => {
  try {
    const { update_id, pre_checkout_query, message } = req.body;

    if (pre_checkout_query) {
      // Предварительная проверка платежа
      const { id, from, currency, total_amount, invoice_payload } = pre_checkout_query;
      
      // Проверяем валидность платежа
      const paymentData = JSON.parse(invoice_payload);
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentData.payment_id)
        .single();

      if (!payment || payment.amount * 100 !== total_amount) {
        return res.json({ ok: false, error_message: 'Invalid payment amount' });
      }

      return res.json({ ok: true });
    }

    if (message && message.successful_payment) {
      // Успешный платеж
      const { successful_payment } = message;
      const paymentData = JSON.parse(successful_payment.invoice_payload);
      
      // Обновляем статус платежа
      await supabase
        .from('payments')
        .update({
          status: PAYMENT_STATUSES.PAID,
          provider_payment_id: successful_payment.telegram_payment_charge_id,
          provider_data: { telegram_data: successful_payment },
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentData.payment_id);

      // Обновляем статус заказа
      const { data: payment } = await supabase
        .from('payments')
        .select('order_id')
        .eq('id', paymentData.payment_id)
        .single();

      if (payment) {
        await supabase
          .from('orders')
          .update({
            payment_status: PAYMENT_STATUSES.PAID,
            status: ORDER_STATUSES.PROCESSING,
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.order_id);
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Error in handleTelegramPaymentWebhook:', error);
    res.status(500).json({ ok: false, error_message: 'Internal server error' });
  }
};

// Возврат платежа
const refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        orders (
          id,
          customer_id,
          stores (
            owner_id
          )
        )
      `)
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      return res.status(404).json({ error: 'Платеж не найден' });
    }

    // Проверяем права доступа
    if (req.user.role !== ROLES.ADMIN && 
        payment.orders.stores.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет прав для возврата этого платежа' });
    }

    if (payment.status !== PAYMENT_STATUSES.PAID) {
      return res.status(400).json({ error: 'Можно вернуть только оплаченный платеж' });
    }

    const refundAmount = amount || payment.amount;
    if (refundAmount > payment.amount) {
      return res.status(400).json({ error: 'Сумма возврата не может превышать сумму платежа' });
    }

    // Создаем запись о возврате
    const { data: refund, error: refundError } = await supabase
      .from('payments')
      .insert({
        order_id: payment.order_id,
        amount: -refundAmount,
        payment_method: payment.payment_method,
        status: PAYMENT_STATUSES.REFUNDED,
        transaction_id: generateTransactionId(),
        parent_payment_id: paymentId,
        notes: reason
      })
      .select()
      .single();

    if (refundError) {
      console.error('Error creating refund:', refundError);
      return res.status(500).json({ error: 'Ошибка при создании возврата' });
    }

    // Обновляем статус исходного платежа
    await supabase
      .from('payments')
      .update({
        status: refundAmount === payment.amount ? PAYMENT_STATUSES.REFUNDED : PAYMENT_STATUSES.PARTIALLY_REFUNDED,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId);

    res.json(refund);
  } catch (error) {
    console.error('Error in refundPayment:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Вспомогательные функции

function generateTransactionId() {
  return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateClickSignature(data) {
  // Реализация генерации подписи для Click
  const { click_trans_id, service_id, click_paydoc_id, merchant_trans_id, amount, action, sign_time } = data;
  const secret_key = process.env.CLICK_SECRET_KEY || 'your_click_secret_key';
  
  const signString = `${click_trans_id}${service_id}${click_paydoc_id}${merchant_trans_id}${amount}${action}${sign_time}${secret_key}`;
  return crypto.createHash('md5').update(signString).digest('hex');
}

async function generateClickPayment(payment, order) {
  // Генерация ссылки для оплаты через Click
  const service_id = process.env.CLICK_SERVICE_ID || 'your_service_id';
  const merchant_id = process.env.CLICK_MERCHANT_ID || 'your_merchant_id';
  
  const paymentUrl = `https://my.click.uz/services/pay?service_id=${service_id}&merchant_id=${merchant_id}&amount=${payment.amount}&transaction_param=${payment.transaction_id}`;
  
  return {
    provider_payment_id: payment.transaction_id,
    payment_url: paymentUrl
  };
}

async function generatePaymePayment(payment, order) {
  // Генерация ссылки для оплаты через Payme
  const merchant_id = process.env.PAYME_MERCHANT_ID || 'your_merchant_id';
  const account = { order_id: order.id };
  const accountEncoded = Buffer.from(JSON.stringify(account)).toString('base64');
  
  const paymentUrl = `https://checkout.paycom.uz/${accountEncoded}`;
  
  return {
    provider_payment_id: payment.transaction_id,
    payment_url: paymentUrl
  };
}

async function generateTelegramPayment(payment, order) {
  // Генерация инвойса для Telegram Payments
  // Здесь должна быть интеграция с Telegram Bot API для создания инвойса
  
  return {
    provider_payment_id: payment.transaction_id,
    payment_url: `https://t.me/your_bot?start=pay_${payment.id}`
  };
}

// Обработчики для Payme
async function handlePaymeCheckTransaction(params, res) {
  const { account } = params;
  
  const { data: order } = await supabase
    .from('orders')
    .select('id, total_amount, status')
    .eq('id', account.order_id)
    .single();

  if (!order) {
    return res.json({ error: { code: -31050, message: 'Order not found' } });
  }

  res.json({ result: { allow: true } });
}

async function handlePaymeCreateTransaction(params, res) {
  const { id, time, amount, account } = params;
  
  // Создаем транзакцию в Payme
  const { data: payment } = await supabase
    .from('payments')
    .insert({
      order_id: account.order_id,
      amount: amount / 100,
      payment_method: 'payme',
      status: PAYMENT_STATUSES.PROCESSING,
      provider_payment_id: id,
      transaction_id: generateTransactionId()
    })
    .select()
    .single();

  res.json({
    result: {
      create_time: time,
      transaction: payment.id,
      state: 1
    }
  });
}

async function handlePaymePerformTransaction(params, res) {
  const { id } = params;
  
  // Завершаем транзакцию
  await supabase
    .from('payments')
    .update({
      status: PAYMENT_STATUSES.PAID,
      updated_at: new Date().toISOString()
    })
    .eq('provider_payment_id', id);

  res.json({
    result: {
      perform_time: Date.now(),
      transaction: id,
      state: 2
    }
  });
}

async function handlePaymeCancelTransaction(params, res) {
  const { id, reason } = params;
  
  await supabase
    .from('payments')
    .update({
      status: PAYMENT_STATUSES.CANCELLED,
      notes: `Cancelled: ${reason}`,
      updated_at: new Date().toISOString()
    })
    .eq('provider_payment_id', id);

  res.json({
    result: {
      cancel_time: Date.now(),
      transaction: id,
      state: -1
    }
  });
}

async function handlePaymeCheckTransactionStatus(params, res) {
  const { id } = params;
  
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('provider_payment_id', id)
    .single();

  if (!payment) {
    return res.json({ error: { code: -31003, message: 'Transaction not found' } });
  }

  let state = 1;
  if (payment.status === PAYMENT_STATUSES.PAID) state = 2;
  if (payment.status === PAYMENT_STATUSES.CANCELLED) state = -1;

  res.json({
    result: {
      create_time: new Date(payment.created_at).getTime(),
      perform_time: payment.status === PAYMENT_STATUSES.PAID ? new Date(payment.updated_at).getTime() : 0,
      cancel_time: payment.status === PAYMENT_STATUSES.CANCELLED ? new Date(payment.updated_at).getTime() : 0,
      transaction: payment.id,
      state,
      reason: payment.notes || null
    }
  });
}

module.exports = {
  createPayment,
  getPaymentStatus,
  handleClickWebhook,
  handlePaymeWebhook,
  handleTelegramPaymentWebhook,
  refundPayment
};

