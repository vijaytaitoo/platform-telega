const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  handleTelegramWebhook,
  setWebhook,
  deleteWebhook,
  getWebhookInfo,
  startPolling,
  sendTestMessage
} = require('../controllers/webhookController');

// Обработка вебхука от Telegram (без аутентификации)
router.post('/telegram/:storeId', handleTelegramWebhook);

// Управление вебхуками (с аутентификацией)
router.post('/stores/:storeId/set', authenticateToken, setWebhook);
router.delete('/stores/:storeId/delete', authenticateToken, deleteWebhook);
router.get('/stores/:storeId/info', authenticateToken, getWebhookInfo);
router.post('/stores/:storeId/start-polling', authenticateToken, startPolling);
router.post('/stores/:storeId/test-message', authenticateToken, sendTestMessage);

module.exports = router;

