// Global in-memory statistics for health check and dashboard
const stats = {
  totalRequests: 0,
  failedLogins: 0,
  apiCalls: {}
};

module.exports = stats;
