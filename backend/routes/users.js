const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getUsers,
  getPendingUsers,
  authorizeUser,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  getUserCompany,
  updateUserCompany
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, authorize('dueño', 'admin'), getUsers)
  .post(protect, authorize('dueño', 'admin'), [
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
  ], createUser);

router.get('/pending', protect, authorize('dueño', 'admin'), getPendingUsers);
router.put('/:id/authorize', protect, authorize('dueño', 'admin'), authorizeUser);

// Company endpoints
router.route('/company')
  .get(protect, getUserCompany)
  .put(protect, authorize('dueño', 'admin'), updateUserCompany);

router.route('/:id')
  .get(protect, authorize('dueño', 'admin'), getUser)
  .put(protect, authorize('dueño', 'admin'), updateUser)
  .delete(protect, authorize('dueño', 'admin'), deleteUser);

router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('La contraseña actual es requerida'),
  body('newPassword').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
], changePassword);

module.exports = router;
