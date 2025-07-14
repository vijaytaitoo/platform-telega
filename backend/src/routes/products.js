const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../middleware/auth');
const { validateProduct } = require('../middleware/validation');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats
} = require('../controllers/productController');

// Получить все товары магазина
router.get('/', getProducts);

// Получить статистику товаров
router.get('/stats', authenticateToken, getProductStats);

// Получить товар по ID
router.get('/:productId', getProduct);

// Создать новый товар
router.post('/', authenticateToken, validateProduct, createProduct);

// Обновить товар
router.put('/:productId', authenticateToken, validateProduct, updateProduct);

// Удалить товар
router.delete('/:productId', authenticateToken, deleteProduct);

module.exports = router;

