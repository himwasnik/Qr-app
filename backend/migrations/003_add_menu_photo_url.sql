-- Migration: Ensure menu_photo_url and subscription_expiry columns exist
-- Note: These columns are now added in 001_initial_schema.sql
-- This migration is for compatibility and won't fail if columns exist

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'restaurants' AND column_name = 'menu_photo_url'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN menu_photo_url TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'restaurants' AND column_name = 'subscription_expiry'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN subscription_expiry TIMESTAMP;
    END IF;
END $$;