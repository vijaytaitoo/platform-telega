const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validatePayment } = require('../middleware/validation');
const {
  createPayment,
  getPaymentStatus,
  handleClickWebhook,
  handlePaymeWebhook,
  handleTelegramPaymentWebhook,
  refundPayment
} = require('../controllers/paymentController');

// Создать платеж для заказа
router.post('/orders/:orderId/payments', authenticateToken, validatePayment, createPayment);

// Получить статус платежа
router.get('/:paymentId', authenticateToken, getPaymentStatus);

// Возврат платежа
router.post('/:paymentId/refund', authenticateToken, refundPayment);

// Вебхуки платежных систем
router.post('/webhooks/click', handleClickWebhook);
router.post('/webhooks/payme', handlePaymeWebhook);
router.post('/webhooks/telegram', handleTelegramPaymentWebhook);

module.exports = router;

