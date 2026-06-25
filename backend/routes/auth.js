const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateFiscalInfo,
  logout,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', [
  body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], register);

router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es requerida')
], login);

router.post('/forgot-password', [
  body('email').isEmail().withMessage('Email inválido')
], forgotPassword);

router.put('/reset-password/:resetToken', [
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], resetPassword);

router.get('/me', protect, getMe);
router.put('/fiscal-info', protect, updateFiscalInfo);
router.post('/logout', protect, logout);

module.exports = router;
