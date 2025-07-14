const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../middleware/auth');
const { validateCategory } = require('../middleware/validation');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryProducts
} = require('../controllers/categoryController');

// Получить все категории магазина
router.get('/', getCategories);

// Получить категорию по ID
router.get('/:categoryId', getCategory);

// Получить товары категории
router.get('/:categoryId/products', getCategoryProducts);

// Создать новую категорию
router.post('/', authenticateToken, validateCategory, createCategory);

// Обновить категорию
router.put('/:categoryId', authenticateToken, validateCategory, updateCategory);

// Удалить категорию
router.delete('/:categoryId', authenticateToken, deleteCategory);

module.exports = router;

