const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('./middleware/auth');
const { initializeAllBots } = require('./controllers/webhookController');

const app = express();

// Middleware для безопасности
app.use(helmet());

// CORS настройки
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, process.env.ADMIN_URL]
    : true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: 'Слишком много запросов с этого IP, попробуйте позже.'
});
app.use('/api/', limiter);

// Парсинг JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Логирование
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Статические файлы
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API маршруты
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/stores/:storeId/products', require('./routes/products'));
app.use('/api/stores/:storeId/categories', require('./routes/categories'));
app.use('/api/stores/:storeId/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/webhook', require('./routes/webhook'));

// Обработка 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Маршрут не найден',
    path: req.originalUrl,
    method: req.method
  });
});

// Глобальный обработчик ошибок
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Ошибки валидации
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: error.message
    });
  }

  // Ошибки JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Неверный токен авторизации'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Токен авторизации истек'
    });
  }

  // Ошибки Supabase
  if (error.code) {
    return res.status(500).json({
      error: 'Ошибка базы данных',
      code: error.code
    });
  }

  // Общая ошибка сервера
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Инициализация ботов при запуске
if (process.env.NODE_ENV !== 'test') {
  initializeAllBots().catch(console.error);
}

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  });
}

module.exports = app;

