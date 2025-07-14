const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../middleware/auth');
const { validateOrder, validateOrderStatus } = require('../middleware/validation');
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats
} = require('../controllers/orderController');

// Получить все заказы магазина
router.get('/', authenticateToken, getOrders);

// Получить статистику заказов
router.get('/stats', authenticateToken, getOrderStats);

// Получить заказ по ID
router.get('/:orderId', authenticateToken, getOrder);

// Создать новый заказ
router.post('/', authenticateToken, validateOrder, createOrder);

// Обновить статус заказа
router.patch('/:orderId/status', authenticateToken, validateOrderStatus, updateOrderStatus);

// Отменить заказ
router.patch('/:orderId/cancel', authenticateToken, cancelOrder);

module.exports = router;

