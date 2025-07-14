const { supabaseAdmin } = require('../config/database');
const { HTTP_STATUS, USER_ROLES } = require('../config/constants');

/**
 * Create a new store
 */
const createStore = async (req, res) => {
  try {
    const { name, description, currency = 'UZS' } = req.body;
    const userId = req.user.id;

    // Check if user already has a store (sellers can have only one store)
    if (req.user.role === USER_ROLES.SELLER) {
      const { data: existingStore } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingStore) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: 'You already have a store'
        });
      }
    }

    // Create store
    const { data: store, error } = await supabaseAdmin
      .from('stores')
      .insert([{
        user_id: userId,
        name,
        description,
        currency
      }])
      .select()
      .single();

    if (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to create store',
        error: error.message
      });
    }

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Store created successfully',
      data: { store }
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get all stores (admin) or user's stores (seller)
 */
const getStores = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('stores')
      .select(`
        *,
        users!stores_user_id_fkey(username, email)
      `, { count: 'exact' });

    // Filter by user if not admin
    if (req.user.role !== USER_ROLES.ADMIN) {
      query = query.eq('user_id', req.user.id);
    }

    // Add search filter
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data: stores, error, count } = await query;

    if (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to fetch stores',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: {
        stores,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get store by ID
 */
const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;

    let query = supabaseAdmin
      .from('stores')
      .select(`
        *,
        users!stores_user_id_fkey(username, email)
      `)
      .eq('id', id);

    // Filter by user if not admin
    if (req.user.role !== USER_ROLES.ADMIN) {
      query = query.eq('user_id', req.user.id);
    }

    const { data: store, error } = await query.single();

    if (error || !store) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Store not found'
      });
    }

    res.json({
      success: true,
      data: { store }
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update store
 */
const updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, currency, telegram_bot_token, telegram_bot_username, telegram_chat_id, is_active } = req.body;

    // Check if store exists and user has permission
    let checkQuery = supabaseAdmin
      .from('stores')
      .select('id, user_id')
      .eq('id', id);

    if (req.user.role !== USER_ROLES.ADMIN) {
      checkQuery = checkQuery.eq('user_id', req.user.id);
    }

    const { data: existingStore, error: checkError } = await checkQuery.single();

    if (checkError || !existingStore) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (currency !== undefined) updateData.currency = currency;
    if (telegram_bot_token !== undefined) updateData.telegram_bot_token = telegram_bot_token;
    if (telegram_bot_username !== undefined) updateData.telegram_bot_username = telegram_bot_username;
    if (telegram_chat_id !== undefined) updateData.telegram_chat_id = telegram_chat_id;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update store
    const { data: store, error } = await supabaseAdmin
      .from('stores')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to update store',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Store updated successfully',
      data: { store }
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Delete store
 */
const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if store exists and user has permission
    let checkQuery = supabaseAdmin
      .from('stores')
      .select('id, user_id')
      .eq('id', id);

    if (req.user.role !== USER_ROLES.ADMIN) {
      checkQuery = checkQuery.eq('user_id', req.user.id);
    }

    const { data: existingStore, error: checkError } = await checkQuery.single();

    if (checkError || !existingStore) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Delete store (cascade will handle related records)
    const { error } = await supabaseAdmin
      .from('stores')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to delete store',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Store deleted successfully'
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get store statistics
 */
const getStoreStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if store exists and user has permission
    let checkQuery = supabaseAdmin
      .from('stores')
      .select('id, user_id')
      .eq('id', id);

    if (req.user.role !== USER_ROLES.ADMIN) {
      checkQuery = checkQuery.eq('user_id', req.user.id);
    }

    const { data: existingStore, error: checkError } = await checkQuery.single();

    if (checkError || !existingStore) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Get statistics
    const [
      { count: totalProducts },
      { count: totalOrders },
      { count: pendingOrders },
      { data: revenueData }
    ] = await Promise.all([
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('store_id', id),
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).eq('store_id', id),
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).eq('store_id', id).eq('status', 'pending'),
      supabaseAdmin.from('orders').select('total_amount').eq('store_id', id).eq('payment_status', 'paid')
    ]);

    const totalRevenue = revenueData?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalProducts,
          totalOrders,
          pendingOrders,
          totalRevenue
        }
      }
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createStore,
  getStores,
  getStoreById,
  updateStore,
  deleteStore,
  getStoreStats
};

