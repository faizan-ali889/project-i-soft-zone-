// Environment Configuration Loader
const path = require('path');
const dotenv = require('dotenv');

const nodeEnv = process.env.NODE_ENV || 'development';
const envPath = path.resolve(__dirname, `../.env.${nodeEnv}`);

dotenv.config({ path: envPath });

console.log(`Loaded environment variables from ${envPath}`);
