const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createSale,
  getSales,
  getSale,
  cancelSale,
  refundSale,
  getSaleStats,
  getTodaySales,
  generateSalePDF
} = require('../controllers/saleController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getSales)
  .post(protect, [
    body('items').isArray({ min: 1 }).withMessage('Debe haber al menos un ítem'),
    body('paymentMethod').isIn(['cash', 'card', 'credit', 'transfer']).withMessage('Método de pago inválido'),
    body('paidAmount').isNumeric().withMessage('El monto pagado debe ser numérico')
  ], createSale);

router.get('/stats', protect, authorize('dueño'), getSaleStats);
router.get('/today', protect, getTodaySales);

router.route('/:id')
  .get(protect, getSale)
  .put(protect, authorize('dueño'), cancelSale);

router.put('/:id/refund', protect, authorize('dueño'), refundSale);
router.get('/:id/pdf', protect, generateSalePDF);

module.exports = router;
