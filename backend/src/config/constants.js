// Роли пользователей
const ROLES = {
  ADMIN: 'admin',
  SELLER: 'seller',
  BUYER: 'buyer'
};

// Статусы заказов
const ORDER_STATUSES = {
  PENDING: 'pending',           // Ожидает обработки
  PROCESSING: 'processing',     // В обработке
  CONFIRMED: 'confirmed',       // Подтвержден
  SHIPPED: 'shipped',          // Отправлен
  DELIVERED: 'delivered',      // Доставлен
  CANCELLED: 'cancelled',      // Отменен
  RETURNED: 'returned'         // Возвращен
};

// Статусы платежей
const PAYMENT_STATUSES = {
  PENDING: 'pending',                    // Ожидает оплаты
  PROCESSING: 'processing',              // В процессе оплаты
  PAID: 'paid',                         // Оплачен
  FAILED: 'failed',                     // Ошибка оплаты
  CANCELLED: 'cancelled',               // Отменен
  REFUNDED: 'refunded',                 // Возвращен
  PARTIALLY_REFUNDED: 'partially_refunded' // Частично возвращен
};

// Методы оплаты
const PAYMENT_METHODS = {
  CLICK: 'click',
  PAYME: 'payme',
  TELEGRAM: 'telegram',
  CASH: 'cash',
  CARD: 'card'
};

// Методы доставки
const DELIVERY_METHODS = {
  PICKUP: 'pickup',        // Самовывоз
  DELIVERY: 'delivery',    // Доставка
  POST: 'post'            // Почта
};

// Типы уведомлений
const NOTIFICATION_TYPES = {
  ORDER_CREATED: 'order_created',
  ORDER_CONFIRMED: 'order_confirmed',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_CANCELLED: 'order_cancelled',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_FAILED: 'payment_failed',
  LOW_STOCK: 'low_stock',
  NEW_REVIEW: 'new_review'
};

// Валюты
const CURRENCIES = {
  UZS: 'UZS',  // Узбекский сум
  USD: 'USD',  // Доллар США
  EUR: 'EUR',  // Евро
  RUB: 'RUB'   // Российский рубль
};

// Лимиты
const LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024,      // 10MB
  MAX_IMAGES_PER_PRODUCT: 10,           // Максимум изображений на товар
  MAX_PRODUCTS_PER_STORE: 10000,        // Максимум товаров в магазине
  MAX_CATEGORIES_PER_STORE: 100,        // Максимум категорий в магазине
  MIN_PASSWORD_LENGTH: 6,               // Минимальная длина пароля
  MAX_DESCRIPTION_LENGTH: 5000,         // Максимальная длина описания
  MAX_NAME_LENGTH: 255                  // Максимальная длина названия
};

// Настройки пагинации
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

// Регулярные выражения для валидации
const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  TELEGRAM_USERNAME: /^@?[a-zA-Z0-9_]{5,32}$/,
  SLUG: /^[a-z0-9-]+$/,
  URL: /^https?:\/\/.+/
};

// Поддерживаемые форматы файлов
const SUPPORTED_FILE_FORMATS = {
  IMAGES: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  DOCUMENTS: ['pdf', 'doc', 'docx', 'txt'],
  VIDEOS: ['mp4', 'avi', 'mov', 'wmv']
};

// Настройки безопасности
const SECURITY = {
  JWT_EXPIRES_IN: '7d',
  REFRESH_TOKEN_EXPIRES_IN: '30d',
  PASSWORD_SALT_ROUNDS: 12,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_TIME: 15 * 60 * 1000, // 15 минут
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 минут
  RATE_LIMIT_MAX_REQUESTS: 100
};

// Настройки Telegram Bot
const TELEGRAM = {
  MAX_MESSAGE_LENGTH: 4096,
  MAX_CAPTION_LENGTH: 1024,
  MAX_BUTTONS_PER_ROW: 8,
  MAX_BUTTONS_TOTAL: 100,
  WEBHOOK_TIMEOUT: 30000
};

// Настройки уведомлений
const NOTIFICATIONS = {
  EMAIL_ENABLED: true,
  SMS_ENABLED: false,
  TELEGRAM_ENABLED: true,
  PUSH_ENABLED: false
};

module.exports = {
  ROLES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  DELIVERY_METHODS,
  NOTIFICATION_TYPES,
  CURRENCIES,
  LIMITS,
  PAGINATION,
  REGEX,
  SUPPORTED_FILE_FORMATS,
  SECURITY,
  TELEGRAM,
  NOTIFICATIONS
};

