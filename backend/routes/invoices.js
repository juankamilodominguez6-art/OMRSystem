const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createInvoice,
  getInvoices,
  getInvoice,
  anularInvoice,
  getInvoiceStats,
  generatePDF
} = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getInvoices)
  .post(protect, [
    body('adquiriente.nombre').trim().notEmpty().withMessage('El nombre del cliente es requerido'),
    body('adquiriente.tipoDocumento').isIn(['CC', 'NIT', 'CE', 'TI', 'PP']).withMessage('Tipo de documento inválido'),
    body('adquiriente.numeroDocumento').trim().notEmpty().withMessage('El número de documento es requerido'),
    body('items').isArray({ min: 1 }).withMessage('Debe haber al menos un ítem'),
    body('formaPago.tipo').isIn(['efectivo', 'tarjeta', 'transferencia', 'credito']).withMessage('Forma de pago inválida')
  ], createInvoice);

router.get('/stats', protect, authorize('dueño'), getInvoiceStats);

router.route('/:id')
  .get(protect, getInvoice)
  .put(protect, authorize('dueño'), anularInvoice);

router.get('/:id/pdf', protect, generatePDF);

module.exports = router;
