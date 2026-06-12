const { Pool } = require("pg");
require('./env');

const poolConfig = process.env.DATABASE_URL 
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'loginapp',
      password: String(process.env.DB_PASSWORD || 'password'),
      port: parseInt(process.env.DB_PORT || '5432'),
    };

// Enable SSL with rejection tolerance for production or connection string hosts (e.g. Neon/Supabase)
if (process.env.NODE_ENV === 'production' || process.env.DATABASE_URL) {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;