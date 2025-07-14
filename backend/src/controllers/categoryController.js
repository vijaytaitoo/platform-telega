const { supabase } = require('../config/database');
const { ROLES } = require('../config/constants');

// Получить все категории магазина
const getCategories = async (req, res) => {
  try {
    const { storeId } = req.params;

    const { data: categories, error } = await supabase
      .from('categories')
      .select(`
        *,
        products!inner(count)
      `)
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ error: 'Ошибка при получении категорий' });
    }

    res.json(categories);
  } catch (error) {
    console.error('Error in getCategories:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Получить категорию по ID
const getCategory = async (req, res) => {
  try {
    const { storeId, categoryId } = req.params;

    const { data: category, error } = await supabase
      .from('categories')
      .select(`
        *,
        stores (
          id,
          name,
          slug,
          owner_id
        )
      `)
      .eq('id', categoryId)
      .eq('store_id', storeId)
      .single();

    if (error || !category) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error in getCategory:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Создать новую категорию
const createCategory = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { name, description, image_url, parent_id } = req.body;

    // Проверяем права доступа
    if (req.user.role !== ROLES.ADMIN) {
      const { data: store } = await supabase
        .from('stores')
        .select('owner_id')
        .eq('id', storeId)
        .single();

      if (!store || store.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Нет прав для создания категории в этом магазине' });
      }
    }

    // Создаем slug из названия
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9а-я]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        store_id: storeId,
        name,
        description,
        image_url,
        parent_id,
        slug,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return res.status(500).json({ error: 'Ошибка при создании категории' });
    }

    res.status(201).json(category);
  } catch (error) {
    console.error('Error in createCategory:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Обновить категорию
const updateCategory = async (req, res) => {
  try {
    const { storeId, categoryId } = req.params;
    const updates = req.body;

    // Проверяем права доступа
    if (req.user.role !== ROLES.ADMIN) {
      const { data: store } = await supabase
        .from('stores')
        .select('owner_id')
        .eq('id', storeId)
        .single();

      if (!store || store.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Нет прав для редактирования категории в этом магазине' });
      }
    }

    // Обновляем slug если изменилось название
    if (updates.name) {
      updates.slug = updates.name.toLowerCase()
        .replace(/[^a-z0-9а-я]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    updates.updated_at = new Date().toISOString();

    const { data: category, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', categoryId)
      .eq('store_id', storeId)
      .select()
      .single();

    if (error || !category) {
      console.error('Error updating category:', error);
      return res.status(404).json({ error: 'Категория не найдена или ошибка при обновлении' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error in updateCategory:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Удалить категорию
const deleteCategory = async (req, res) => {
  try {
    const { storeId, categoryId } = req.params;

    // Проверяем права доступа
    if (req.user.role !== ROLES.ADMIN) {
      const { data: store } = await supabase
        .from('stores')
        .select('owner_id')
        .eq('id', storeId)
        .single();

      if (!store || store.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Нет прав для удаления категории в этом магазине' });
      }
    }

    // Проверяем, есть ли товары в этой категории
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('category_id', categoryId)
      .eq('is_active', true);

    if (products && products.length > 0) {
      return res.status(400).json({ 
        error: 'Нельзя удалить категорию, в которой есть активные товары' 
      });
    }

    // Мягкое удаление - помечаем как неактивную
    const { data: category, error } = await supabase
      .from('categories')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId)
      .eq('store_id', storeId)
      .select()
      .single();

    if (error || !category) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    res.json({ message: 'Категория успешно удалена' });
  } catch (error) {
    console.error('Error in deleteCategory:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Получить товары категории
const getCategoryProducts = async (req, res) => {
  try {
    const { storeId, categoryId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const { data: products, error, count } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name,
          slug
        )
      `, { count: 'exact' })
      .eq('store_id', storeId)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching category products:', error);
      return res.status(500).json({ error: 'Ошибка при получении товаров категории' });
    }

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error in getCategoryProducts:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryProducts
};

