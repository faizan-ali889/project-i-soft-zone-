// Auth Router Controller
const AuthService = require('../services/authService');

class AuthController {
  static async register(req, res, next) {
    try {
      const user = await AuthService.register(req.validatedData);
      res.status(201).json({
        message: `User registered successfully as ${user.role}!`,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.validatedData;
      const result = await AuthService.login(email, password);
      res.status(200).json({
        token: result.token,
        message: 'Login Success',
        user: result.user
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserProfile(req, res, next) {
    try {
      // req.user contains full user info attached by authMiddleware
      res.status(200).json({ user: req.user });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
