// Auth API Integration Tests using Jest and Supertest
const request = require('supertest');
const app = require('../index');
const db = require('../config/db');

describe('Auth API Endpoints', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  afterAll(async () => {
    // End PG connection pool to prevent hanging
    await db.end();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should successfully log in with seeded admin credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@company.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.message).toEqual('Login Success');
      expect(res.body.user.email).toEqual('admin@company.com');
      expect(res.body.user.role).toEqual('ADMIN');
    });

    it('should fail to log in with incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@company.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message');
    });
  });
});
