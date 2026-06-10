// Leave API Integration Tests using Jest and Supertest
const request = require('supertest');
const app = require('../index');
const db = require('../config/db');

describe('Leave API Endpoints', () => {
  let employeeToken;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    
    // Obtain employee token
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'employee@company.com',
        password: 'password123'
      });
    employeeToken = res.body.token;
  });

  afterAll(async () => {
    await db.end();
  });

  describe('GET /api/v1/leaves/balance', () => {
    it('should successfully retrieve leave balances for logged in employee', async () => {
      const res = await request(app)
        .get('/api/v1/leaves/balance')
        .set('Authorization', employeeToken);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('available_days');
        expect(res.body[0]).toHaveProperty('used_days');
      }
    });
  });

  describe('GET /api/v1/leaves/types', () => {
    it('should retrieve list of leave types', async () => {
      const res = await request(app)
        .get('/api/v1/leaves/types')
        .set('Authorization', employeeToken);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });
});
