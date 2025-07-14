const { supabase } = require('../config/database');
const telegramBotService = require('../services/telegramBotService');

// Обработка вебхука от Telegram бота
const handleTelegramWebhook = async (req, res) => {
  try {
    const { storeId } = req.params;
    const update = req.body;

    // Логируем входящий запрос для отладки
    console.log(`Webhook received for store ${storeId}:`, JSON.stringify(update, null, 2));

    // Проверяем, что магазин существует и активен
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, is_active, telegram_bot_token')
      .eq('id', storeId)
      .eq('is_active', true)
      .single();

    if (storeError || !store) {
      console.error(`Store ${storeId} not found or inactive`);
      return res.status(404).json({ error: 'Магазин не найден или неактивен' });
    }

    // Инициализируем бота если он еще не инициализирован
    if (!telegramBotService.activeBots.has(storeId)) {
      if (!store.telegram_bot_token) {
        console.error(`No bot token for store ${storeId}`);
        return res.status(400).json({ error: 'Токен бота не настроен' });
      }

      await telegramBotService.initializeBot(storeId, store.telegram_bot_token);
    }

    // Обрабатываем обновление
    await telegramBotService.handleUpdate(storeId, update);

    res.json({ ok: true });
  } catch (error) {
    console.error('Error handling Telegram webhook:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Установка вебхука для магазина
const setWebhook = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { webhook_url } = req.body;

    // Проверяем права доступа
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('owner_id, telegram_bot_token')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return res.status(404).json({ error: 'Магазин не найден' });
    }

    if (req.user.role !== 'admin' && store.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет прав для настройки вебхука' });
    }

    if (!store.telegram_bot_token) {
      return res.status(400).json({ error: 'Сначала настройте токен Telegram бота' });
    }

    // Инициализируем бота если нужно
    if (!telegramBotService.activeBots.has(storeId)) {
      await telegramBotService.initializeBot(storeId, store.telegram_bot_token);
    }

    // Устанавливаем вебхук
    const webhookUrl = webhook_url || `${process.env.BASE_URL}/api/webhook/telegram/${storeId}`;
    const success = await telegramBotService.setWebhook(storeId, webhookUrl);

    if (success) {
      // Сохраняем URL вебхука в настройках магазина
      await supabase
        .from('stores')
        .update({ 
          webhook_url: webhookUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId);

      res.json({ 
        success: true, 
        webhook_url: webhookUrl,
        message: 'Вебхук успешно установлен'
      });
    } else {
      res.status(500).json({ error: 'Ошибка при установке вебхука' });
    }
  } catch (error) {
    console.error('Error setting webhook:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Удаление вебхука для магазина
const deleteWebhook = async (req, res) => {
  try {
    const { storeId } = req.params;

    // Проверяем права доступа
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return res.status(404).json({ error: 'Магазин не найден' });
    }

    if (req.user.role !== 'admin' && store.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет прав для удаления вебхука' });
    }

    // Удаляем вебхук
    const success = await telegramBotService.deleteWebhook(storeId);

    if (success) {
      // Удаляем URL вебхука из настроек магазина
      await supabase
        .from('stores')
        .update({ 
          webhook_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId);

      res.json({ 
        success: true,
        message: 'Вебхук успешно удален'
      });
    } else {
      res.status(500).json({ error: 'Ошибка при удалении вебхука' });
    }
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Получение информации о вебхуке
const getWebhookInfo = async (req, res) => {
  try {
    const { storeId } = req.params;

    // Проверяем права доступа
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('owner_id, webhook_url, telegram_bot_token')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return res.status(404).json({ error: 'Магазин не найден' });
    }

    if (req.user.role !== 'admin' && store.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет прав для просмотра информации о вебхуке' });
    }

    // Получаем информацию о вебхуке от Telegram
    let webhookInfo = null;
    if (store.telegram_bot_token) {
      try {
        const axios = require('axios');
        const response = await axios.get(`https://api.telegram.org/bot${store.telegram_bot_token}/getWebhookInfo`);
        webhookInfo = response.data.result;
      } catch (error) {
        console.error('Error getting webhook info from Telegram:', error);
      }
    }

    res.json({
      store_webhook_url: store.webhook_url,
      telegram_webhook_info: webhookInfo,
      bot_configured: !!store.telegram_bot_token
    });
  } catch (error) {
    console.error('Error getting webhook info:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Запуск polling режима для разработки
const startPolling = async (req, res) => {
  try {
    const { storeId } = req.params;

    // Проверяем права доступа
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('owner_id, telegram_bot_token')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return res.status(404).json({ error: 'Магазин не найден' });
    }

    if (req.user.role !== 'admin' && store.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет прав для запуска polling' });
    }

    if (!store.telegram_bot_token) {
      return res.status(400).json({ error: 'Сначала настройте токен Telegram бота' });
    }

    // Инициализируем бота если нужно
    if (!telegramBotService.activeBots.has(storeId)) {
      await telegramBotService.initializeBot(storeId, store.telegram_bot_token);
    }

    // Удаляем вебхук перед запуском polling
    await telegramBotService.deleteWebhook(storeId);

    // Здесь можно добавить логику для polling режима
    // В production лучше использовать вебхуки

    res.json({ 
      success: true,
      message: 'Polling режим запущен (только для разработки)'
    });
  } catch (error) {
    console.error('Error starting polling:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Отправка тестового сообщения
const sendTestMessage = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { chat_id, message } = req.body;

    // Проверяем права доступа
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('owner_id, telegram_bot_token')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return res.status(404).json({ error: 'Магазин не найден' });
    }

    if (req.user.role !== 'admin' && store.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет прав для отправки сообщений' });
    }

    if (!store.telegram_bot_token) {
      return res.status(400).json({ error: 'Сначала настройте токен Telegram бота' });
    }

    // Инициализируем бота если нужно
    if (!telegramBotService.activeBots.has(storeId)) {
      await telegramBotService.initializeBot(storeId, store.telegram_bot_token);
    }

    const bot = telegramBotService.activeBots.get(storeId);
    const testMessage = message || 'Тестовое сообщение от вашего Telegram магазина! 🛍️';

    // Отправляем сообщение
    const result = await telegramBotService.sendMessage(bot, chat_id, testMessage);

    if (result) {
      res.json({ 
        success: true,
        message: 'Тестовое сообщение отправлено',
        telegram_response: result
      });
    } else {
      res.status(500).json({ error: 'Ошибка при отправке сообщения' });
    }
  } catch (error) {
    console.error('Error sending test message:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Инициализация всех активных ботов при запуске сервера
const initializeAllBots = async () => {
  try {
    console.log('Initializing all active bots...');

    const { data: stores, error } = await supabase
      .from('stores')
      .select('id, telegram_bot_token')
      .eq('is_active', true)
      .not('telegram_bot_token', 'is', null);

    if (error) {
      console.error('Error fetching stores:', error);
      return;
    }

    for (const store of stores) {
      try {
        await telegramBotService.initializeBot(store.id, store.telegram_bot_token);
        console.log(`Bot initialized for store ${store.id}`);
      } catch (error) {
        console.error(`Error initializing bot for store ${store.id}:`, error);
      }
    }

    console.log(`Initialized ${stores.length} bots`);
  } catch (error) {
    console.error('Error initializing bots:', error);
  }
};

module.exports = {
  handleTelegramWebhook,
  setWebhook,
  deleteWebhook,
  getWebhookInfo,
  startPolling,
  sendTestMessage,
  initializeAllBots
};

