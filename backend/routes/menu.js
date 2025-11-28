const express = require('express');
const { body, param } = require('express-validator');
const { query } = require('../db');
const { authenticateToken, requireActiveSubscription } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validator');
const { upload, uploadToS3, deleteFromS3 } = require('../utils/s3Upload');

const router = express.Router();

// ============ CATEGORIES ============

// GET /api/menu/categories - Get all categories for restaurant
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, description, sort_order, is_active, created_at, updated_at
       FROM menu_categories
       WHERE restaurant_id = $1
       ORDER BY sort_order, name`,
      [req.user.restaurantId]
    );

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

// POST /api/menu/categories - Create new category
router.post(
  '/categories',
  authenticateToken,
  requireActiveSubscription,
  [
    body('name').trim().isLength({ min: 1 }).withMessage('Category name is required'),
    body('description').optional().trim(),
    body('sort_order').optional().isInt(),
    body('is_active').optional().isBoolean(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, description, sort_order, is_active } = req.body;

      const result = await query(
        `INSERT INTO menu_categories (restaurant_id, name, description, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, description, sort_order, is_active, created_at`,
        [req.user.restaurantId, name, description || null, sort_order || 0, is_active !== false]
      );

      res.status(201).json({
        message: 'Category created successfully',
        category: result.rows[0],
      });
    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  }
);

// PUT /api/menu/categories/:id - Update category
router.put(
  '/categories/:id',
  authenticateToken,
  requireActiveSubscription,
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1 }),
    body('description').optional().trim(),
    body('sort_order').optional().isInt(),
    body('is_active').optional().isBoolean(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, sort_order, is_active } = req.body;

      // Verify ownership
      const checkResult = await query(
        'SELECT id FROM menu_categories WHERE id = $1 AND restaurant_id = $2',
        [id, req.user.restaurantId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }

      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (name) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }
      if (sort_order !== undefined) {
        updates.push(`sort_order = $${paramIndex++}`);
        values.push(sort_order);
      }
      if (is_active !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(is_active);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.user.restaurantId);

      const result = await query(
        `UPDATE menu_categories
         SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND restaurant_id = $${paramIndex}
         RETURNING id, name, description, sort_order, is_active, updated_at`,
        values
      );

      res.json({
        message: 'Category updated successfully',
        category: result.rows[0],
      });
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({ error: 'Failed to update category' });
    }
  }
);

// DELETE /api/menu/categories/:id - Delete category
router.delete(
  '/categories/:id',
  authenticateToken,
  requireActiveSubscription,
  [param('id').isUUID()],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await query(
        'DELETE FROM menu_categories WHERE id = $1 AND restaurant_id = $2 RETURNING id',
        [id, req.user.restaurantId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }

      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ error: 'Failed to delete category' });
    }
  }
);

// ============ MENU ITEMS ============

// GET /api/menu/items - Get all menu items for restaurant
router.get('/items', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT mi.id, mi.category_id, mi.name, mi.description, mi.price_cents, mi.currency,
              mi.photo_url, mi.is_available, mi.is_vegetarian, mi.is_vegan, mi.is_gluten_free,
              mi.allergens, mi.sort_order, mi.created_at, mi.updated_at,
              mc.name as category_name
       FROM menu_items mi
       LEFT JOIN menu_categories mc ON mi.category_id = mc.id
       WHERE mi.restaurant_id = $1
       ORDER BY mi.sort_order, mi.name`,
      [req.user.restaurantId]
    );

    res.json({ items: result.rows });
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ error: 'Failed to load menu items' });
  }
});

// POST /api/menu/items - Create new menu item
router.post(
  '/items',
  authenticateToken,
  requireActiveSubscription,
  [
    body('category_id').optional().isUUID(),
    body('name').trim().isLength({ min: 1 }).withMessage('Item name is required'),
    body('description').optional().trim(),
    body('price_cents').isInt({ min: 0 }).withMessage('Price is required'),
    body('currency').optional().isLength({ min: 3, max: 3 }),
    body('is_available').optional().isBoolean(),
    body('is_vegetarian').optional().isBoolean(),
    body('is_vegan').optional().isBoolean(),
    body('is_gluten_free').optional().isBoolean(),
    body('allergens').optional().isArray(),
    body('sort_order').optional().isInt(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        category_id,
        name,
        description,
        price_cents,
        currency,
        is_available,
        is_vegetarian,
        is_vegan,
        is_gluten_free,
        allergens,
        sort_order,
      } = req.body;

      // Verify category belongs to restaurant if provided
      if (category_id) {
        const categoryCheck = await query(
          'SELECT id FROM menu_categories WHERE id = $1 AND restaurant_id = $2',
          [category_id, req.user.restaurantId]
        );

        if (categoryCheck.rows.length === 0) {
          return res.status(400).json({ error: 'Invalid category' });
        }
      }

      const result = await query(
        `INSERT INTO menu_items
         (restaurant_id, category_id, name, description, price_cents, currency,
          is_available, is_vegetarian, is_vegan, is_gluten_free, allergens, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          req.user.restaurantId,
          category_id || null,
          name,
          description || null,
          price_cents,
          currency || 'USD',
          is_available !== false,
          is_vegetarian || false,
          is_vegan || false,
          is_gluten_free || false,
          allergens || [],
          sort_order || 0,
        ]
      );

      res.status(201).json({
        message: 'Menu item created successfully',
        item: result.rows[0],
      });
    } catch (error) {
      console.error('Create menu item error:', error);
      res.status(500).json({ error: 'Failed to create menu item' });
    }
  }
);

// PUT /api/menu/items/:id - Update menu item
router.put(
  '/items/:id',
  authenticateToken,
  requireActiveSubscription,
  [
    param('id').isUUID(),
    body('category_id').optional().isUUID(),
    body('name').optional().trim().isLength({ min: 1 }),
    body('description').optional().trim(),
    body('price_cents').optional().isInt({ min: 0 }),
    body('currency').optional().isLength({ min: 3, max: 3 }),
    body('is_available').optional().isBoolean(),
    body('is_vegetarian').optional().isBoolean(),
    body('is_vegan').optional().isBoolean(),
    body('is_gluten_free').optional().isBoolean(),
    body('allergens').optional().isArray(),
    body('sort_order').optional().isInt(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verify ownership
      const checkResult = await query(
        'SELECT id FROM menu_items WHERE id = $1 AND restaurant_id = $2',
        [id, req.user.restaurantId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      const updates = [];
      const values = [];
      let paramIndex = 1;

      const fields = [
        'category_id',
        'name',
        'description',
        'price_cents',
        'currency',
        'is_available',
        'is_vegetarian',
        'is_vegan',
        'is_gluten_free',
        'allergens',
        'sort_order',
      ];

      fields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates.push(`${field} = $${paramIndex++}`);
          values.push(req.body[field]);
        }
      });

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.user.restaurantId);

      const result = await query(
        `UPDATE menu_items
         SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND restaurant_id = $${paramIndex}
         RETURNING *`,
        values
      );

      res.json({
        message: 'Menu item updated successfully',
        item: result.rows[0],
      });
    } catch (error) {
      console.error('Update menu item error:', error);
      res.status(500).json({ error: 'Failed to update menu item' });
    }
  }
);

// DELETE /api/menu/items/:id - Delete menu item
router.delete(
  '/items/:id',
  authenticateToken,
  requireActiveSubscription,
  [param('id').isUUID()],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get item to delete photo from S3
      const itemResult = await query(
        'SELECT photo_url FROM menu_items WHERE id = $1 AND restaurant_id = $2',
        [id, req.user.restaurantId]
      );

      if (itemResult.rows.length === 0) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      // Delete from database
      await query('DELETE FROM menu_items WHERE id = $1', [id]);

      // Delete photo from S3 if exists
      if (itemResult.rows[0].photo_url) {
        await deleteFromS3(itemResult.rows[0].photo_url);
      }

      res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
      console.error('Delete menu item error:', error);
      res.status(500).json({ error: 'Failed to delete menu item' });
    }
  }
);

// POST /api/menu/items/:id/upload-photo - Upload photo for menu item
router.post(
  '/items/:id/upload-photo',
  authenticateToken,
  requireActiveSubscription,
  upload.single('photo'),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Verify ownership
      const itemResult = await query(
        'SELECT photo_url FROM menu_items WHERE id = $1 AND restaurant_id = $2',
        [id, req.user.restaurantId]
      );

      if (itemResult.rows.length === 0) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      // Upload new photo to S3
      const photoUrl = await uploadToS3(req.file, 'menu-items');

      // Delete old photo from S3 if exists
      if (itemResult.rows[0].photo_url) {
        await deleteFromS3(itemResult.rows[0].photo_url);
      }

      // Update database
      const result = await query(
        'UPDATE menu_items SET photo_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [photoUrl, id]
      );

      res.json({
        message: 'Photo uploaded successfully',
        item: result.rows[0],
      });
    } catch (error) {
      console.error('Upload photo error:', error);
      res.status(500).json({ error: 'Failed to upload photo' });
    }
  }
);

// ============ MENU ============

// GET /api/menu - Get menu with photo and items
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Fetch restaurant details including menu photo
    const restaurantResult = await query(
      `SELECT name, menu_photo_url FROM restaurants WHERE id = $1`,
      [req.user.restaurantId]
    );

    if (restaurantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const restaurant = restaurantResult.rows[0];

    // Fetch menu items
    const menuItemsResult = await query(
      `SELECT id, category_id, name, description, price_cents, currency, photo_url, is_available
       FROM menu_items
       WHERE restaurant_id = $1
       ORDER BY sort_order, name`,
      [req.user.restaurantId]
    );

    res.json({
      restaurant: {
        name: restaurant.name,
        menuPhotoUrl: restaurant.menu_photo_url,
      },
      menuItems: menuItemsResult.rows,
    });
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ error: 'Failed to load menu' });
  }
});

module.exports = router;
