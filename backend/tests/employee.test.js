// Employee API Integration Tests using Jest and Supertest
const request = require('supertest');
const app = require('../index');
const db = require('../config/db');

describe('Employee API Endpoints', () => {
  let adminToken;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    
    // Obtain admin token for authenticated routes
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@company.com',
        password: 'password123'
      });
    adminToken = res.body.token;
  });

  afterAll(async () => {
    await db.end();
  });

  describe('GET /api/v1/employees', () => {
    it('should successfully get the directory of employees', async () => {
      const res = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', adminToken);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('employee_name');
    });
  });

  describe('POST /api/v1/employees (Create Employee)', () => {
    it('should fail to create employee if missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', adminToken)
        .send({
          designation: 'Staff'
        });

      expect(res.statusCode).toEqual(422); // Validation error
    });
  });
});
