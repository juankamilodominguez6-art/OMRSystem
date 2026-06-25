const Invoice = require('../models/Invoice');
const User = require('../models/User');
const { Sequelize } = require('sequelize');

// @desc    Crear nueva factura
// @route   POST /api/invoices
// @access  Privado (Dueño y Cliente)
exports.createInvoice = async (req, res, next) => {
  try {
    const { 
      emisor, 
      adquiriente, 
      items, 
      formaPago, 
      observaciones,
      prefijo 
    } = req.body;

    // Validar items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La factura debe tener al menos un ítem'
      });
    }

    // Validar cada ítem
    for (const item of items) {
      if (!item.descripcion || !item.cantidad || !item.valorUnitario) {
        return res.status(400).json({
          success: false,
          message: 'Cada ítem debe tener descripción, cantidad y valor unitario'
        });
      }
    }

    // Obtener consecutivo
    const consecutivo = await Invoice.getNextConsecutivo(prefijo || 'FV');

    // Configuración del emisor (puede venir del request o usar configuración por defecto)
    const emisorConfig = emisor || {
      nombre: 'Mi Negocio',
      nit: process.env.DIAN_NIT || '900123456-7',
      direccion: 'Calle Principal #123',
      telefono: '+57 300 123 4567',
      ciudad: 'Bogotá',
      regimenTributario: process.env.DIAN_REGIMEN || '48'
    };

    // Crear factura
    const invoice = await Invoice.create({
      consecutivo,
      prefijo: prefijo || 'FV',
      emisor: emisorConfig,
      adquiriente,
      items,
      formaPago,
      observaciones,
      userId: req.user.id
    });

    // Cargar usuario asociado
    const invoiceWithUser = await Invoice.findByPk(invoice.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
    });

    res.status(201).json({
      success: true,
      invoice: invoiceWithUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener todas las facturas del usuario actual
// @route   GET /api/invoices
// @access  Privado
exports.getInvoices = async (req, res, next) => {
  try {
    const where = {};

    // Si es dueño, puede ver todas las facturas
    if (req.user.role !== 'dueño') {
      where.userId = req.user.id;
    }

    // Filtros opcionales
    if (req.query.estado) {
      where.estado = req.query.estado;
    }

    if (req.query.fechaInicio && req.query.fechaFin) {
      where.fechaEmision = {
        [Sequelize.Op.gte]: new Date(req.query.fechaInicio),
        [Sequelize.Op.lte]: new Date(req.query.fechaFin)
      };
    }

    const invoices = await Invoice.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['fechaEmision', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: invoices.length,
      invoices
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener factura por ID
// @route   GET /api/invoices/:id
// @access  Privado
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }

    // Verificar permisos
    if (req.user.role !== 'dueño' && invoice.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta factura'
      });
    }

    res.status(200).json({
      success: true,
      invoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Anular factura
// @route   PUT /api/invoices/:id/anular
// @access  Privado (Dueño)
exports.anularInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }

    if (invoice.estado === 'anulada') {
      return res.status(400).json({
        success: false,
        message: 'La factura ya está anulada'
      });
    }

    invoice.estado = 'anulada';
    invoice.observaciones = (invoice.observaciones || '') + '\n[ANULADA]';
    await invoice.save();

    res.status(200).json({
      success: true,
      invoice,
      message: 'Factura anulada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener estadísticas de facturación
// @route   GET /api/invoices/stats
// @access  Privado (Dueño)
exports.getInvoiceStats = async (req, res, next) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    const where = { estado: 'emitida' };
    
    if (fechaInicio && fechaFin) {
      where.fechaEmision = {
        [Sequelize.Op.gte]: new Date(fechaInicio),
        [Sequelize.Op.lte]: new Date(fechaFin)
      };
    }

    const invoices = await Invoice.findAll({ where });
    
    const totalFacturas = invoices.length;
    const totalVentas = invoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    const totalSubtotal = invoices.reduce((sum, inv) => sum + parseFloat(inv.subtotal), 0);
    const totalIva = invoices.reduce((sum, inv) => sum + parseFloat(inv.ivaTotal), 0);
    const totalInc = invoices.reduce((sum, inv) => sum + parseFloat(inv.incTotal), 0);
    const promedioVenta = totalFacturas > 0 ? totalVentas / totalFacturas : 0;

    // Facturas por estado
    const estadoStats = {};
    invoices.forEach(inv => {
      const estado = inv.estado;
      if (!estadoStats[estado]) {
        estadoStats[estado] = { count: 0, total: 0 };
      }
      estadoStats[estado].count++;
      estadoStats[estado].total += parseFloat(inv.total);
    });
    
    const estadoStatsArray = Object.keys(estadoStats).map(estado => ({
      _id: estado,
      ...estadoStats[estado]
    }));

    // Ventas por forma de pago
    const pagoStats = {};
    invoices.forEach(inv => {
      const tipo = inv.formaPago?.tipo || 'efectivo';
      if (!pagoStats[tipo]) {
        pagoStats[tipo] = { count: 0, total: 0 };
      }
      pagoStats[tipo].count++;
      pagoStats[tipo].total += parseFloat(inv.total);
    });
    
    const pagoStatsArray = Object.keys(pagoStats).map(tipo => ({
      _id: tipo,
      ...pagoStats[tipo]
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalFacturas,
        totalVentas,
        totalSubtotal,
        totalIva,
        totalInc,
        promedioVenta
      },
      estadoStats,
      pagoStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generar PDF de factura (placeholder)
// @route   GET /api/invoices/:id/pdf
// @access  Privado
exports.generatePDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('usuario', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }

    // Verificar permisos
    if (req.user.role !== 'dueño' && invoice.usuario._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta factura'
      });
    }

    // Aquí se implementaría la generación de PDF con una librería como pdfkit o puppeteer
    // Por ahora retornamos los datos para que el frontend genere el PDF
    
    res.status(200).json({
      success: true,
      message: 'Datos de factura para generar PDF',
      invoice
    });
  } catch (error) {
    next(error);
  }
};
