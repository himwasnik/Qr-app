const express = require('express');
const QRCode = require('qrcode');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadToS3 } = require('../utils/s3Upload');
const { query } = require('../db');
const { authenticateToken, requireActiveSubscription } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validator');
const { createBillingPortalSession } = require('../utils/stripe');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Configure multer for local file uploads
const uploadLocal = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../uploads/menu-photos');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
  }),
});

// GET /api/restaurants/:slug/public - Get public menu (no auth required)
router.get('/:slug/public', async (req, res) => {
  try {
    const { slug } = req.params;

    // Get restaurant info
    const restaurantResult = await query(
      `SELECT id, name, slug, phone, address, logo_url, menu_photo_url
       FROM restaurants
       WHERE slug = $1 AND subscription_status = 'active'`,
      [slug]
    );

    if (restaurantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found or inactive' });
    }

    const restaurant = restaurantResult.rows[0];

    // Get categories with menu items
    const categoriesResult = await query(
      `SELECT id, name, description, sort_order
       FROM menu_categories
       WHERE restaurant_id = $1 AND is_active = true
       ORDER BY sort_order, name`,
      [restaurant.id]
    );

    // Get menu items for each category
    const menuItemsResult = await query(
      `SELECT id, category_id, name, description, price_cents, currency,
              photo_url, is_available, is_vegetarian, is_vegan, is_gluten_free,
              allergens, sort_order
       FROM menu_items
       WHERE restaurant_id = $1 AND is_available = true
       ORDER BY sort_order, name`,
      [restaurant.id]
    );

    // Organize menu items by category
    const categories = categoriesResult.rows.map((category) => ({
      ...category,
      items: menuItemsResult.rows.filter((item) => item.category_id === category.id),
    }));

    res.json({
      restaurant: {
        name: restaurant.name,
        phone: restaurant.phone,
        address: restaurant.address,
        logoUrl: restaurant.logo_url,
        menuPhotoUrl: restaurant.menu_photo_url,
      },
      menu: categories,
    });
  } catch (error) {
    console.error('Get public menu error:', error);
    res.status(500).json({ error: 'Failed to load menu' });
  }
});

// GET /api/restaurants/:slug/qr.png - Generate QR code as PNG
router.get('/:slug/qr.png', async (req, res) => {
  try {
    const { slug } = req.params;

    // Verify restaurant exists
    const result = await query('SELECT id FROM restaurants WHERE slug = $1', [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Generate QR code URL pointing to frontend customer menu
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const menuUrl = `${frontendUrl}/menu/${slug}`;

    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(menuUrl, {
      errorCorrectionLevel: 'H',
      type: 'png',
      quality: 0.95,
      margin: 1,
      width: 512,
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="${slug}-qr.png"`);
    res.send(qrBuffer);
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// GET /api/restaurants/:slug/qr.svg - Generate QR code as SVG
router.get('/:slug/qr.svg', async (req, res) => {
  try {
    const { slug } = req.params;

    // Verify restaurant exists
    const result = await query('SELECT id FROM restaurants WHERE slug = $1', [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Generate QR code URL pointing to frontend customer menu
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const menuUrl = `${frontendUrl}/menu/${slug}`;

    // Generate QR code as SVG
    const qrSvg = await QRCode.toString(menuUrl, {
      type: 'svg',
      errorCorrectionLevel: 'H',
    });

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `inline; filename="${slug}-qr.svg"`);
    res.send(qrSvg);
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// GET /api/restaurants/me - Get current restaurant details (auth required)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const restaurantResult = await query(
      `SELECT id, name, slug, owner_email, phone, address, logo_url, menu_photo_url,
              subscription_status, subscription_expiry, created_at, updated_at
       FROM restaurants
       WHERE id = $1`,
      [req.user.restaurantId]
    );

    if (restaurantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const restaurant = restaurantResult.rows[0];

    // Check if subscription is expired
    let actualStatus = restaurant.subscription_status;
    if (restaurant.subscription_expiry && new Date(restaurant.subscription_expiry) < new Date()) {
      actualStatus = 'expired';
      // Optionally update the database to reflect expired status
      await query(
        'UPDATE restaurants SET subscription_status = $1 WHERE id = $2',
        ['expired', req.user.restaurantId]
      );
    }

    // Fetch subscription payment history
    const paymentHistoryResult = await query(
      `SELECT payment_date, amount_cents, payment_method, payment_status, subscription_expiry
       FROM subscription_payments
       WHERE restaurant_id = $1
       ORDER BY payment_date DESC`,
      [req.user.restaurantId]
    );

    res.json({
      restaurant: { ...restaurant, subscription_status: actualStatus },
      subscriptionExpiry: restaurant.subscription_expiry,
      isExpired: actualStatus === 'expired',
      paymentHistory: paymentHistoryResult.rows,
    });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({ error: 'Failed to load restaurant' });
  }
});

// PUT /api/restaurants/me - Update restaurant details
router.put(
  '/me',
  authenticateToken,
  requireActiveSubscription,
  [
    body('name').optional().trim().isLength({ min: 2 }),
    body('phone').optional().trim(),
    body('address').optional().trim(),
    body('logo_url').optional().trim().isURL(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, phone, address, logo_url } = req.body;

      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (name) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (phone !== undefined) {
        updates.push(`phone = $${paramIndex++}`);
        values.push(phone);
      }
      if (address !== undefined) {
        updates.push(`address = $${paramIndex++}`);
        values.push(address);
      }
      if (logo_url !== undefined) {
        updates.push(`logo_url = $${paramIndex++}`);
        values.push(logo_url);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(req.user.restaurantId);

      const result = await query(
        `UPDATE restaurants
         SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex}
         RETURNING id, name, slug, owner_email, phone, address, logo_url, subscription_status`,
        values
      );

      res.json({
        message: 'Restaurant updated successfully',
        restaurant: result.rows[0],
      });
    } catch (error) {
      console.error('Update restaurant error:', error);
      res.status(500).json({ error: 'Failed to update restaurant' });
    }
  }
);

// POST /api/restaurants/billing-portal - Ensure valid billing portal URL
router.post('/billing-portal', authenticateToken, async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;

    // Check if the restaurant exists
    const result = await query(
      'SELECT id, subscription_status, subscription_expiry FROM restaurants WHERE id = $1',
      [restaurantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const restaurant = result.rows[0];

    // Generate billing portal URL with restaurant details
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const billingPortalUrl = `${frontendUrl}/billing-portal?restaurantId=${restaurantId}&status=${restaurant.subscription_status}`;

    res.status(200).json({
      message: 'Billing portal session created successfully',
      billingPortalUrl,
      subscriptionStatus: restaurant.subscription_status,
      subscriptionExpiry: restaurant.subscription_expiry,
    });
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    res.status(500).json({ error: 'Failed to create billing portal session' });
  }
});

// POST /api/restaurants/me/upload-menu-photo - Upload menu card photo
router.post('/me/upload-menu-photo', authenticateToken, uploadLocal.single('menuPhoto'), async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const photoUrl = `/uploads/menu-photos/${file.filename}`;

    // Update restaurant record with photo URL
    await query('UPDATE restaurants SET menu_photo_url = $1 WHERE id = $2', [photoUrl, restaurantId]);

    res.status(200).json({ message: 'Menu photo uploaded successfully', photoUrl });
  } catch (error) {
    console.error('Error uploading menu photo:', error);
    res.status(500).json({ error: 'Failed to upload menu photo' });
  }
});

// POST /api/restaurants/renew-subscription - Renew subscription via UPI/Net Banking
router.post('/renew-subscription', authenticateToken, async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;

    // Get payment details from request
    const { paymentMethod, amountCents } = req.body;
    if (!paymentMethod || !amountCents) {
      return res.status(400).json({ error: 'Payment method and amount are required' });
    }

    // Calculate new expiry date (1 month from now)
    const newExpiryDate = new Date();
    newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);

    // Record the payment in subscription_payments table
    await query(
      `INSERT INTO subscription_payments (restaurant_id, payment_date, amount_cents, payment_method, payment_status, subscription_expiry)
       VALUES ($1, CURRENT_TIMESTAMP, $2, $3, 'success', $4)`,
      [restaurantId, amountCents, paymentMethod, newExpiryDate]
    );

    // Update restaurant subscription status
    await query(
      'UPDATE restaurants SET subscription_status = $1, subscription_expiry = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      ['active', newExpiryDate, restaurantId]
    );

    res.status(200).json({
      message: 'Subscription renewed successfully',
      subscriptionStatus: 'active',
      subscriptionExpiry: newExpiryDate,
    });
  } catch (error) {
    console.error('Error renewing subscription:', error);
    res.status(500).json({ error: 'Failed to renew subscription' });
  }
});

module.exports = router;
