const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

async function runMigrations() {
  console.log('🔄 Starting database migrations...\n');

  try {
    // Read and execute schema migration
    const schemaPath = path.join(__dirname, '001_initial_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📝 Running 001_initial_schema.sql...');
    await pool.query(schemaSql);
    console.log('✅ Schema migration completed\n');

    // Optionally run seed data (comment out for production)
    const seedPath = path.join(__dirname, '002_seed_data.sql');
    if (fs.existsSync(seedPath)) {
      console.log('📝 Running 002_seed_data.sql...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await pool.query(seedSql);
      console.log('✅ Seed data migration completed\n');
    }

    console.log('🎉 All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
