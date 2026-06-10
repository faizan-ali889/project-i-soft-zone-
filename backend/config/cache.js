// Node Cache Setup and Configuration
const NodeCache = require('node-cache');

// Standard Cache duration is 1 hour (3600 seconds)
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

console.log('Initialize global NodeCache (stdTTL: 1h)');

module.exports = cache;
