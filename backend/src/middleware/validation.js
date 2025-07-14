const { body, param, query, validationResult } = require('express-validator');
const { 
  ROLES, 
  ORDER_STATUSES, 
  PAYMENT_STATUSES, 
  PAYMENT_METHODS,
  DELIVERY_METHODS,
  LIMITS,
  REGEX 
} = require('../config/constants');

// Middleware для обработки ошибок валидации
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: errors.array()
    });
  }
  next();
};

// Валидация пользователя
const validateUser = [
  body('telegram_id')
    .isInt({ min: 1 })
    .withMessage('Telegram ID должен быть положительным числом'),
  body('telegram_username')
    .optional()
    .matches(REGEX.TELEGRAM_USERNAME)
    .withMessage('Неверный формат Telegram username'),
  body('first_name')
    .isLength({ min: 1, max: LIMITS.MAX_NAME_LENGTH })
    .withMessage(`Имя должно быть от 1 до ${LIMITS.MAX_NAME_LENGTH} символов`),
  body('last_name')
    .optional()
    .isLength({ max: LIMITS.MAX_NAME_LENGTH })
    .withMessage(`Фамилия не должна превышать ${LIMITS.MAX_NAME_LENGTH} символов`),
  body('phone')
    .optional()
    .matches(REGEX.PHONE)
    .withMessage('Неверный формат номера телефона'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Неверный формат email'),
  body('role')
    .optional()
    .isIn(Object.values(ROLES))
    .withMessage('Неверная роль пользователя'),
  handleValidationErrors
];

// Валидация магазина
const validateStore = [
  body('name')
    .isLength({ min: 1, max: LIMITS.MAX_NAME_LENGTH })
    .withMessage(`Название магазина должно быть от 1 до ${LIMITS.MAX_NAME_LENGTH} символов`),
  body('description')
    .optional()
    .isLength({ max: LIMITS.MAX_DESCRIPTION_LENGTH })
    .withMessage(`Описание не должно превышать ${LIMITS.MAX_DESCRIPTION_LENGTH} символов`),
  body('logo_url')
    .optional()
    .matches(REGEX.URL)
    .withMessage('Неверный формат URL логотипа'),
  body('contact_info.phone')
    .optional()
    .matches(REGEX.PHONE)
    .withMessage('Неверный формат номера телефона'),
  body('contact_info.email')
    .optional()
    .isEmail()
    .withMessage('Неверный формат email'),
  body('contact_info.address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Адрес не должен превышать 500 символов'),
  body('settings.currency')
    .optional()
    .isIn(['UZS', 'USD', 'EUR', 'RUB'])
    .withMessage('Неподдерживаемая валюта'),
  body('settings.language')
    .optional()
    .isIn(['uz', 'ru', 'en'])
    .withMessage('Неподдерживаемый язык'),
  handleValidationErrors
];

// Валидация товара
const validateProduct = [
  body('name')
    .isLength({ min: 1, max: LIMITS.MAX_NAME_LENGTH })
    .withMessage(`Название товара должно быть от 1 до ${LIMITS.MAX_NAME_LENGTH} символов`),
  body('description')
    .optional()
    .isLength({ max: LIMITS.MAX_DESCRIPTION_LENGTH })
    .withMessage(`Описание не должно превышать ${LIMITS.MAX_DESCRIPTION_LENGTH} символов`),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Цена должна быть положительным числом'),
  body('category_id')
    .optional()
    .isUUID()
    .withMessage('Неверный формат ID категории'),
  body('images')
    .optional()
    .isArray({ max: LIMITS.MAX_IMAGES_PER_PRODUCT })
    .withMessage(`Максимум ${LIMITS.MAX_IMAGES_PER_PRODUCT} изображений`),
  body('images.*')
    .optional()
    .matches(REGEX.URL)
    .withMessage('Неверный формат URL изображения'),
  body('sku')
    .optional()
    .isLength({ max: 100 })
    .withMessage('SKU не должен превышать 100 символов'),
  body('stock_quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Количество на складе должно быть неотрицательным числом'),
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Вес должен быть положительным числом'),
  body('dimensions.length')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Длина должна быть положительным числом'),
  body('dimensions.width')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Ширина должна быть положительным числом'),
  body('dimensions.height')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Высота должна быть положительным числом'),
  handleValidationErrors
];

// Валидация категории
const validateCategory = [
  body('name')
    .isLength({ min: 1, max: LIMITS.MAX_NAME_LENGTH })
    .withMessage(`Название категории должно быть от 1 до ${LIMITS.MAX_NAME_LENGTH} символов`),
  body('description')
    .optional()
    .isLength({ max: LIMITS.MAX_DESCRIPTION_LENGTH })
    .withMessage(`Описание не должно превышать ${LIMITS.MAX_DESCRIPTION_LENGTH} символов`),
  body('image_url')
    .optional()
    .matches(REGEX.URL)
    .withMessage('Неверный формат URL изображения'),
  body('parent_id')
    .optional()
    .isUUID()
    .withMessage('Неверный формат ID родительской категории'),
  handleValidationErrors
];

// Валидация заказа
const validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Заказ должен содержать хотя бы один товар'),
  body('items.*.product_id')
    .isUUID()
    .withMessage('Неверный формат ID товара'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Количество должно быть положительным числом'),
  body('customer_info.name')
    .isLength({ min: 1, max: LIMITS.MAX_NAME_LENGTH })
    .withMessage('Имя покупателя обязательно'),
  body('customer_info.phone')
    .matches(REGEX.PHONE)
    .withMessage('Неверный формат номера телефона'),
  body('customer_info.email')
    .optional()
    .isEmail()
    .withMessage('Неверный формат email'),
  body('delivery_address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Адрес доставки не должен превышать 500 символов'),
  body('delivery_method')
    .optional()
    .isIn(Object.values(DELIVERY_METHODS))
    .withMessage('Неверный метод доставки'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Примечания не должны превышать 1000 символов'),
  handleValidationErrors
];

// Валидация статуса заказа
const validateOrderStatus = [
  body('status')
    .isIn(Object.values(ORDER_STATUSES))
    .withMessage('Неверный статус заказа'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Примечания не должны превышать 1000 символов'),
  handleValidationErrors
];

// Валидация платежа
const validatePayment = [
  body('payment_method')
    .isIn(Object.values(PAYMENT_METHODS))
    .withMessage('Неверный метод оплаты'),
  handleValidationErrors
];

// Валидация параметров запроса
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Номер страницы должен быть положительным числом'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Лимит должен быть от 1 до 100'),
  handleValidationErrors
];

// Валидация UUID параметров
const validateUUID = (paramName) => [
  param(paramName)
    .isUUID()
    .withMessage(`${paramName} должен быть валидным UUID`),
  handleValidationErrors
];

// Валидация поиска
const validateSearch = [
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Поисковый запрос должен быть от 1 до 100 символов'),
  query('category_id')
    .optional()
    .isUUID()
    .withMessage('Неверный формат ID категории'),
  query('sort_by')
    .optional()
    .isIn(['name', 'price', 'created_at', 'updated_at'])
    .withMessage('Неверное поле для сортировки'),
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Порядок сортировки должен быть asc или desc'),
  handleValidationErrors
];

// Валидация загрузки файлов
const validateFileUpload = [
  body('file_type')
    .optional()
    .isIn(['image', 'document', 'video'])
    .withMessage('Неверный тип файла'),
  handleValidationErrors
];

// Валидация настроек магазина
const validateStoreSettings = [
  body('telegram_bot_token')
    .optional()
    .isLength({ min: 40, max: 50 })
    .withMessage('Неверный формат токена Telegram бота'),
  body('payment_settings.click_enabled')
    .optional()
    .isBoolean()
    .withMessage('Click enabled должен быть boolean'),
  body('payment_settings.payme_enabled')
    .optional()
    .isBoolean()
    .withMessage('Payme enabled должен быть boolean'),
  body('payment_settings.telegram_enabled')
    .optional()
    .isBoolean()
    .withMessage('Telegram payments enabled должен быть boolean'),
  body('notification_settings.email_enabled')
    .optional()
    .isBoolean()
    .withMessage('Email notifications должен быть boolean'),
  body('notification_settings.telegram_enabled')
    .optional()
    .isBoolean()
    .withMessage('Telegram notifications должен быть boolean'),
  handleValidationErrors
];

module.exports = {
  validateUser,
  validateStore,
  validateProduct,
  validateCategory,
  validateOrder,
  validateOrderStatus,
  validatePayment,
  validatePagination,
  validateUUID,
  validateSearch,
  validateFileUpload,
  validateStoreSettings,
  handleValidationErrors
};

