const axios = require('axios');
const { supabase } = require('../config/database');
const { ORDER_STATUSES, PAYMENT_STATUSES } = require('../config/constants');

class TelegramBotService {
  constructor() {
    this.activeBots = new Map(); // Хранилище активных ботов
  }

  // Инициализация бота для магазина
  async initializeBot(storeId, botToken) {
    try {
      const bot = {
        token: botToken,
        storeId: storeId,
        baseUrl: `https://api.telegram.org/bot${botToken}`,
        sessions: new Map() // Сессии пользователей
      };

      // Проверяем валидность токена
      const botInfo = await this.getBotInfo(bot);
      if (!botInfo) {
        throw new Error('Неверный токен бота');
      }

      // Настраиваем команды бота
      await this.setupBotCommands(bot);

      // Сохраняем бота в активных
      this.activeBots.set(storeId, bot);

      console.log(`Bot initialized for store ${storeId}: @${botInfo.username}`);
      return bot;
    } catch (error) {
      console.error('Error initializing bot:', error);
      throw error;
    }
  }

  // Получение информации о боте
  async getBotInfo(bot) {
    try {
      const response = await axios.get(`${bot.baseUrl}/getMe`);
      return response.data.result;
    } catch (error) {
      console.error('Error getting bot info:', error);
      return null;
    }
  }

  // Настройка команд бота
  async setupBotCommands(bot) {
    const commands = [
      { command: 'start', description: 'Начать работу с магазином' },
      { command: 'catalog', description: 'Посмотреть каталог товаров' },
      { command: 'cart', description: 'Моя корзина' },
      { command: 'orders', description: 'Мои заказы' },
      { command: 'help', description: 'Помощь' },
      { command: 'contact', description: 'Контакты магазина' }
    ];

    try {
      await axios.post(`${bot.baseUrl}/setMyCommands`, {
        commands: commands
      });
    } catch (error) {
      console.error('Error setting bot commands:', error);
    }
  }

  // Обработка обновлений от Telegram
  async handleUpdate(storeId, update) {
    const bot = this.activeBots.get(storeId);
    if (!bot) {
      console.error(`Bot not found for store ${storeId}`);
      return;
    }

    try {
      if (update.message) {
        await this.handleMessage(bot, update.message);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(bot, update.callback_query);
      } else if (update.pre_checkout_query) {
        await this.handlePreCheckoutQuery(bot, update.pre_checkout_query);
      }
    } catch (error) {
      console.error('Error handling update:', error);
    }
  }

  // Обработка сообщений
  async handleMessage(bot, message) {
    const chatId = message.chat.id;
    const userId = message.from.id;
    const text = message.text;

    // Получаем или создаем пользователя
    await this.getOrCreateUser(userId, message.from);

    // Получаем сессию пользователя
    let session = bot.sessions.get(userId) || { state: 'main_menu', data: {} };

    if (text?.startsWith('/')) {
      await this.handleCommand(bot, message, text);
    } else {
      await this.handleTextMessage(bot, message, session);
    }

    // Сохраняем сессию
    bot.sessions.set(userId, session);
  }

  // Обработка команд
  async handleCommand(bot, message, command) {
    const chatId = message.chat.id;
    const userId = message.from.id;

    switch (command.split(' ')[0]) {
      case '/start':
        await this.handleStartCommand(bot, message);
        break;
      case '/catalog':
        await this.showCatalog(bot, chatId);
        break;
      case '/cart':
        await this.showCart(bot, chatId, userId);
        break;
      case '/orders':
        await this.showOrders(bot, chatId, userId);
        break;
      case '/help':
        await this.showHelp(bot, chatId);
        break;
      case '/contact':
        await this.showContact(bot, chatId);
        break;
      default:
        await this.sendMessage(bot, chatId, 'Неизвестная команда. Используйте /help для просмотра доступных команд.');
    }
  }

  // Команда /start
  async handleStartCommand(bot, message) {
    const chatId = message.chat.id;
    
    // Получаем информацию о магазине
    const { data: store } = await supabase
      .from('stores')
      .select('name, description, logo_url')
      .eq('id', bot.storeId)
      .single();

    const welcomeText = `🛍️ Добро пожаловать в ${store?.name || 'наш магазин'}!

${store?.description || 'Здесь вы можете найти лучшие товары по отличным ценам.'}

Выберите действие:`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '📱 Каталог товаров', callback_data: 'catalog' }],
        [{ text: '🛒 Моя корзина', callback_data: 'cart' }],
        [{ text: '📋 Мои заказы', callback_data: 'orders' }],
        [{ text: '📞 Контакты', callback_data: 'contact' }]
      ]
    };

    await this.sendMessage(bot, chatId, welcomeText, { reply_markup: keyboard });
  }

  // Показать каталог
  async showCatalog(bot, chatId, categoryId = null) {
    try {
      // Получаем категории или товары
      if (!categoryId) {
        const { data: categories } = await supabase
          .from('categories')
          .select('id, name, image_url')
          .eq('store_id', bot.storeId)
          .eq('is_active', true)
          .order('name');

        if (categories && categories.length > 0) {
          const keyboard = {
            inline_keyboard: categories.map(cat => [
              { text: cat.name, callback_data: `category_${cat.id}` }
            ])
          };

          await this.sendMessage(bot, chatId, '📱 Выберите категорию:', { reply_markup: keyboard });
        } else {
          // Показываем все товары если нет категорий
          await this.showProducts(bot, chatId);
        }
      } else {
        await this.showProducts(bot, chatId, categoryId);
      }
    } catch (error) {
      console.error('Error showing catalog:', error);
      await this.sendMessage(bot, chatId, 'Ошибка при загрузке каталога');
    }
  }

  // Показать товары
  async showProducts(bot, chatId, categoryId = null) {
    try {
      let query = supabase
        .from('products')
        .select('id, name, description, price, images')
        .eq('store_id', bot.storeId)
        .eq('is_active', true)
        .limit(10);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data: products } = await query;

      if (!products || products.length === 0) {
        await this.sendMessage(bot, chatId, 'В данной категории пока нет товаров');
        return;
      }

      for (const product of products) {
        await this.sendProduct(bot, chatId, product);
      }
    } catch (error) {
      console.error('Error showing products:', error);
      await this.sendMessage(bot, chatId, 'Ошибка при загрузке товаров');
    }
  }

  // Отправить товар
  async sendProduct(bot, chatId, product) {
    const text = `🛍️ *${product.name}*

${product.description || 'Описание отсутствует'}

💰 Цена: *${product.price.toLocaleString()} сум*`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🛒 В корзину', callback_data: `add_to_cart_${product.id}` },
          { text: '❤️ В избранное', callback_data: `add_to_favorites_${product.id}` }
        ]
      ]
    };

    if (product.images && product.images.length > 0) {
      await this.sendPhoto(bot, chatId, product.images[0], text, { reply_markup: keyboard });
    } else {
      await this.sendMessage(bot, chatId, text, { reply_markup: keyboard });
    }
  }

  // Показать корзину
  async showCart(bot, chatId, userId) {
    try {
      // Получаем товары из корзины (можно хранить в сессии или в БД)
      const session = bot.sessions.get(userId) || { data: {} };
      const cart = session.data.cart || {};

      if (Object.keys(cart).length === 0) {
        await this.sendMessage(bot, chatId, '🛒 Ваша корзина пуста');
        return;
      }

      const productIds = Object.keys(cart);
      const { data: products } = await supabase
        .from('products')
        .select('id, name, price')
        .in('id', productIds);

      let totalAmount = 0;
      let cartText = '🛒 *Ваша корзина:*\n\n';

      products.forEach(product => {
        const quantity = cart[product.id];
        const itemTotal = product.price * quantity;
        totalAmount += itemTotal;

        cartText += `• ${product.name}\n`;
        cartText += `  Количество: ${quantity}\n`;
        cartText += `  Цена: ${itemTotal.toLocaleString()} сум\n\n`;
      });

      cartText += `💰 *Итого: ${totalAmount.toLocaleString()} сум*`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '✅ Оформить заказ', callback_data: 'checkout' }],
          [{ text: '🗑️ Очистить корзину', callback_data: 'clear_cart' }],
          [{ text: '🔙 Назад к каталогу', callback_data: 'catalog' }]
        ]
      };

      await this.sendMessage(bot, chatId, cartText, { reply_markup: keyboard });
    } catch (error) {
      console.error('Error showing cart:', error);
      await this.sendMessage(bot, chatId, 'Ошибка при загрузке корзины');
    }
  }

  // Обработка callback запросов
  async handleCallbackQuery(bot, callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    // Подтверждаем получение callback
    await this.answerCallbackQuery(bot, callbackQuery.id);

    if (data === 'catalog') {
      await this.showCatalog(bot, chatId);
    } else if (data === 'cart') {
      await this.showCart(bot, chatId, userId);
    } else if (data.startsWith('category_')) {
      const categoryId = data.replace('category_', '');
      await this.showCatalog(bot, chatId, categoryId);
    } else if (data.startsWith('add_to_cart_')) {
      const productId = data.replace('add_to_cart_', '');
      await this.addToCart(bot, chatId, userId, productId);
    } else if (data === 'checkout') {
      await this.startCheckout(bot, chatId, userId);
    } else if (data === 'clear_cart') {
      await this.clearCart(bot, chatId, userId);
    }
  }

  // Добавить в корзину
  async addToCart(bot, chatId, userId, productId) {
    const session = bot.sessions.get(userId) || { data: {} };
    if (!session.data.cart) session.data.cart = {};

    session.data.cart[productId] = (session.data.cart[productId] || 0) + 1;
    bot.sessions.set(userId, session);

    await this.sendMessage(bot, chatId, '✅ Товар добавлен в корзину!');
  }

  // Начать оформление заказа
  async startCheckout(bot, chatId, userId) {
    const session = bot.sessions.get(userId) || { data: {} };
    session.state = 'checkout_name';
    bot.sessions.set(userId, session);

    await this.sendMessage(bot, chatId, 'Для оформления заказа укажите ваше имя:');
  }

  // Отправить сообщение
  async sendMessage(bot, chatId, text, options = {}) {
    try {
      const payload = {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
        ...options
      };

      const response = await axios.post(`${bot.baseUrl}/sendMessage`, payload);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  // Отправить фото
  async sendPhoto(bot, chatId, photo, caption = '', options = {}) {
    try {
      const payload = {
        chat_id: chatId,
        photo: photo,
        caption: caption,
        parse_mode: 'Markdown',
        ...options
      };

      const response = await axios.post(`${bot.baseUrl}/sendPhoto`, payload);
      return response.data;
    } catch (error) {
      console.error('Error sending photo:', error);
    }
  }

  // Ответить на callback query
  async answerCallbackQuery(bot, callbackQueryId, text = '') {
    try {
      await axios.post(`${bot.baseUrl}/answerCallbackQuery`, {
        callback_query_id: callbackQueryId,
        text: text
      });
    } catch (error) {
      console.error('Error answering callback query:', error);
    }
  }

  // Получить или создать пользователя
  async getOrCreateUser(telegramId, telegramUser) {
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();

      if (existingUser) {
        return existingUser;
      }

      // Создаем нового пользователя
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          telegram_id: telegramId,
          telegram_username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          role: 'buyer'
        })
        .select()
        .single();

      return newUser;
    } catch (error) {
      console.error('Error getting or creating user:', error);
      return null;
    }
  }

  // Отправить уведомление о новом заказе
  async sendOrderNotification(storeId, order) {
    const bot = this.activeBots.get(storeId);
    if (!bot) return;

    try {
      // Получаем информацию о владельце магазина
      const { data: store } = await supabase
        .from('stores')
        .select('owner_id, users(telegram_id)')
        .eq('id', storeId)
        .single();

      if (!store?.users?.telegram_id) return;

      const text = `🔔 *Новый заказ #${order.id}*

💰 Сумма: ${order.total_amount.toLocaleString()} сум
👤 Покупатель: ${order.customer_info.name}
📞 Телефон: ${order.customer_info.phone}

${order.delivery_address ? `📍 Адрес: ${order.delivery_address}` : ''}
${order.notes ? `📝 Примечания: ${order.notes}` : ''}`;

      await this.sendMessage(bot, store.users.telegram_id, text);
    } catch (error) {
      console.error('Error sending order notification:', error);
    }
  }

  // Установить вебхук
  async setWebhook(storeId, webhookUrl) {
    const bot = this.activeBots.get(storeId);
    if (!bot) return false;

    try {
      const response = await axios.post(`${bot.baseUrl}/setWebhook`, {
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query', 'pre_checkout_query']
      });

      return response.data.ok;
    } catch (error) {
      console.error('Error setting webhook:', error);
      return false;
    }
  }

  // Удалить вебхук
  async deleteWebhook(storeId) {
    const bot = this.activeBots.get(storeId);
    if (!bot) return false;

    try {
      const response = await axios.post(`${bot.baseUrl}/deleteWebhook`);
      return response.data.ok;
    } catch (error) {
      console.error('Error deleting webhook:', error);
      return false;
    }
  }
}

module.exports = new TelegramBotService();

