const jwt = require('jsonwebtoken');
const { query } = require('../db');

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user and restaurant info
    const result = await query(
      `SELECT au.id, au.email, au.role, au.restaurant_id,
              r.name as restaurant_name, r.subscription_status, r.slug
       FROM admin_users au
       JOIN restaurants r ON au.restaurant_id = r.id
       WHERE au.id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'User not found' });
    }

    // Attach user info to request
    req.user = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      role: result.rows[0].role,
      restaurantId: result.rows[0].restaurant_id,
      restaurantName: result.rows[0].restaurant_name,
      subscriptionStatus: result.rows[0].subscription_status,
      slug: result.rows[0].slug,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Check if subscription is active
const requireActiveSubscription = (req, res, next) => {
  if (req.user.subscriptionStatus !== 'active') {
    return res.status(402).json({
      error: 'Subscription required',
      message: 'Your subscription is not active. Please update your payment method.',
      subscriptionStatus: req.user.subscriptionStatus,
    });
  }
  next();
};

// Check if user has specific role
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  requireActiveSubscription,
  requireRole,
};
