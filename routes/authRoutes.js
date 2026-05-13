const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  signup,
  login,
  getMe,
  signupValidation,
  loginValidation,
} = require('../controllers/authController');

// Public routes
router.post('/signup', signupValidation, validate, signup);
router.post('/login', loginValidation, validate, login);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
