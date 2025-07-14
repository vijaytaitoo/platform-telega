const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/database');
const { HTTP_STATUS, USER_ROLES } = require('../config/constants');

/**
 * Middleware to verify JWT token
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid token'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== USER_ROLES.ADMIN) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

/**
 * Middleware to check if user is seller or admin
 */
const requireSeller = (req, res, next) => {
  if (req.user.role !== USER_ROLES.SELLER && req.user.role !== USER_ROLES.ADMIN) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Seller access required'
    });
  }
  next();
};

/**
 * Middleware to verify Telegram authentication data
 */
const verifyTelegramAuth = (req, res, next) => {
  try {
    const { hash, ...data } = req.body;
    
    if (!hash) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Telegram hash required'
      });
    }

    // Create data check string
    const dataCheckString = Object.keys(data)
      .sort()
      .map(key => `${key}=${data[key]}`)
      .join('\n');

    // Create secret key
    const crypto = require('crypto');
    const secretKey = crypto.createHash('sha256')
      .update(process.env.TELEGRAM_BOT_TOKEN)
      .digest();

    // Create hash
    const calculatedHash = crypto.createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid Telegram authentication'
      });
    }

    // Check if auth data is not too old (5 minutes)
    const authDate = parseInt(data.auth_date);
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (currentTime - authDate > 300) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Telegram authentication expired'
      });
    }

    req.telegramData = data;
    next();
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid Telegram authentication'
    });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireSeller,
  verifyTelegramAuth
};

