// Database setup script - Run this once to create the users table
// Usage: node backend/setup-db.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

async function setupDatabase() {
  try {
    console.log(`Connecting to database: ${process.env.DB_NAME}...`);
    const client = await pool.connect();
    
    console.log('Creating users table...');
    await client.query(createTableQuery);
    
    console.log('✅ Database setup completed successfully!');
    console.log(`Table 'users' created in database '${process.env.DB_NAME}'`);
    client.release();
    pool.end();
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    pool.end();
    process.exit(1);
  }
}

setupDatabase();
