-- Sample seed data for development and testing
-- You can customize this or skip it for production

-- Note: Password for demo users is "password123" (hashed with bcrypt)
-- In production, you should create users through the registration API

-- Sample Restaurant 1
INSERT INTO restaurants (id, name, slug, owner_email, phone, address, subscription_status, subscription_expiry)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'The Tasty Corner',
  'tasty-corner',
  'owner@tastycorner.com',
  '+1-555-0100',
  '123 Main Street, New York, NY 10001',
  'active',
  CURRENT_TIMESTAMP + INTERVAL '30 days'
);

-- Sample Admin User for Restaurant 1
-- Password: password123
INSERT INTO admin_users (restaurant_id, email, password_hash, role)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'owner@tastycorner.com',
  '$2a$10$X8xZ8K5Z8K5Z8K5Z8K5Z8OJ1J1J1J1J1J1J1J1J1J1J1J1J1J1J1J1', -- This is a placeholder, generate real hash
  'admin'
);

-- Sample Categories for Restaurant 1
INSERT INTO menu_categories (id, restaurant_id, name, description, sort_order, is_active)
VALUES
  (uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'Appetizers', 'Start your meal right', 1, true),
  (uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'Main Course', 'Our signature dishes', 2, true),
  (uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'Desserts', 'Sweet endings', 3, true),
  (uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'Beverages', 'Drinks and refreshments', 4, true);

-- Sample Menu Items
-- Note: Get category IDs first, then insert items
-- For simplicity, this is a template. In practice, you'd need to reference actual category IDs

-- Example structure (modify category_id after categories are created):
-- INSERT INTO menu_items (restaurant_id, category_id, name, description, price_cents, currency, is_available, is_vegetarian, sort_order)
-- VALUES
--   ('11111111-1111-1111-1111-111111111111', '<appetizer-category-id>', 'Spring Rolls', 'Crispy vegetable spring rolls served with sweet chili sauce', 899, 'USD', true, true, 1),
--   ('11111111-1111-1111-1111-111111111111', '<main-category-id>', 'Grilled Salmon', 'Fresh Atlantic salmon with herbs and lemon', 1899, 'USD', true, false, 1);

-- Create subscription_payments table to track payment history
CREATE TABLE IF NOT EXISTS subscription_payments (
    id SERIAL PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    amount_cents INT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('success', 'failed', 'pending')),
    subscription_expiry TIMESTAMP NOT NULL
);
