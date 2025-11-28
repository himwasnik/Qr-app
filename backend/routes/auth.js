const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { query, transaction } = require('../db');
const { handleValidationErrors } = require('../middleware/validator');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Generate slug from restaurant name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Math.random().toString(36).substring(2, 7);
};

// POST /api/auth/register - Register new restaurant
router.post(
  '/register',
  [
    body('restaurantName').trim().isLength({ min: 2 }).withMessage('Restaurant name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().trim(),
    body('address').optional().trim(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { restaurantName, email, password, phone, address } = req.body;

      // Check if email already exists
      const existingUser = await query('SELECT id FROM admin_users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Generate unique slug
      let slug = generateSlug(restaurantName);
      let slugExists = await query('SELECT id FROM restaurants WHERE slug = $1', [slug]);
      while (slugExists.rows.length > 0) {
        slug = generateSlug(restaurantName);
        slugExists = await query('SELECT id FROM restaurants WHERE slug = $1', [slug]);
      }

      // Create restaurant and admin user in transaction
      const result = await transaction(async (client) => {
        // Insert restaurant
        const restaurantResult = await client.query(
          `INSERT INTO restaurants (name, slug, owner_email, phone, address, subscription_status)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, name, slug, owner_email, subscription_status`,
          [restaurantName, slug, email, phone, address, 'active']
        );

        const restaurant = restaurantResult.rows[0];

        // Insert admin user
        const userResult = await client.query(
          `INSERT INTO admin_users (restaurant_id, email, password_hash, role)
           VALUES ($1, $2, $3, $4)
           RETURNING id, email, role`,
          [restaurant.id, email, passwordHash, 'admin']
        );

        return {
          user: userResult.rows[0],
          restaurant,
        };
      });

      // Generate JWT
      const token = generateToken(result.user.id);

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: result.user,
        restaurant: result.restaurant,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed', details: error.message });
    }
  }
);

// POST /api/auth/login - Login with email and password
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user with restaurant info
      const result = await query(
        `SELECT au.id, au.email, au.password_hash, au.role, au.restaurant_id,
                r.name as restaurant_name, r.slug, r.subscription_status
         FROM admin_users au
         JOIN restaurants r ON au.restaurant_id = r.id
         WHERE au.email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT
      const token = generateToken(user.id);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        restaurant: {
          id: user.restaurant_id,
          name: user.restaurant_name,
          slug: user.slug,
          subscriptionStatus: user.subscription_status,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

module.exports = router;
