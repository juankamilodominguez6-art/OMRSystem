const Sale = require('../models/Sale');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const Company = require('../models/Company');
const PDFService = require('../services/pdfService');
const { Sequelize } = require('sequelize');

// @desc    Crear nueva venta
// @route   POST /api/sales
// @access  Privado
exports.createSale = async (req, res, next) => {
  try {
    const { 
      customer, 
      items, 
      paymentMethod, 
      paidAmount, 
      notes,
      taxRate,
      createInvoice
    } = req.body;

    // Validar items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La venta debe tener al menos un ítem'
      });
    }

    // Validar cada ítem
    for (const item of items) {
      if (!item.productName || !item.quantity || !item.unitPrice) {
        return res.status(400).json({
          success: false,
          message: 'Cada ítem debe tener nombre, cantidad y precio unitario'
        });
      }
    }

    // Obtener o crear company
    let company = null;
    if (req.companyId) {
      company = await Company.findByPk(req.companyId);
    }

    // Compute next saleNumber
    const lastSale = await Sale.findOne({
      where: { companyId: req.companyId },
      order: [['saleNumber', 'DESC']]
    });
    const nextSaleNumber = lastSale ? lastSale.saleNumber + 1 : 1;

    // Crear venta
    const sale = await Sale.create({
      companyId: req.companyId,
      saleNumber: nextSaleNumber,
      customer: customer || {},
      items,
      paymentMethod,
      paidAmount: paidAmount || 0,
      notes,
      taxRate: taxRate || (company?.settings?.taxRate || 0.19),
      userId: req.user.id
    });

    // Cargar usuario asociado
    const saleWithUser = await Sale.findByPk(sale.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
    });

    // Generar factura DIAN si es necesario
    let invoice = null;
    if (createInvoice && company) {
      try {
        // Convertir items a formato de factura
        const invoiceItems = items.map(item => ({
          descripcion: item.productName,
          cantidad: item.quantity,
          valorUnitario: item.unitPrice,
          ivaTarifa: item.taxRate || (company.settings?.taxRate || 0.19) * 100,
          incTarifa: 0,
          unidadMedida: 'UNIDAD'
        }));

        const consecutivo = await Invoice.getNextConsecutivo(company.id, 'FV');

        invoice = await Invoice.create({
          companyId: company.id,
          consecutivo,
          prefijo: company.dianResolution?.prefijo || 'FV',
          emisor: {
            nombre: company.name,
            nit: company.nit,
            dv: company.dv || '1',
            direccion: company.address,
            telefono: company.phone,
            ciudad: company.city,
            departamento: company.department,
            regimenTributario: company.taxRegime
          },
          adquiriente: {
            nombre: customer?.name || 'CONSUMIDOR FINAL',
            tipoDocumento: customer?.documentType || 'CC',
            numeroDocumento: customer?.document || '2222222222',
            dv: customer?.dv || '',
            direccion: customer?.address || '',
            telefono: customer?.phone || '',
            ciudad: customer?.city || company.city,
            email: customer?.email || ''
          },
          items: invoiceItems,
          formaPago: {
            tipo: paymentMethod === 'cash' ? 'EFECTIVO' : 
                  paymentMethod === 'card' ? 'TARJETA_CREDITO' : 
                  paymentMethod === 'transfer' ? 'TRANSFERENCIA' : 'OTRO',
            descripcion: paymentMethod === 'cash' ? 'Pago en efectivo' : 
                        paymentMethod === 'card' ? 'Pago con tarjeta' : 
                        paymentMethod === 'transfer' ? 'Pago por transferencia' : 'Otro'
          },
          observaciones: notes,
          userId: req.user.id,
          dianStatus: 'pendiente'
        });

        // Asociar factura con venta
        saleWithUser.invoiceId = invoice.id;
        await saleWithUser.save();
      } catch (invoiceError) {
        console.error('Error generando factura DIAN:', invoiceError);
        // Continuar incluso si falla la factura
      }
    }

    // Generar PDF automáticamente
    const companyInfo = company ? {
      nombre: company.name,
      nit: company.nit + (company.dv ? '-' + company.dv : ''),
      direccion: company.address,
      telefono: company.phone,
      ciudad: company.city,
      mensaje: company.settings?.mensaje || '¡Gracias por su compra!',
      dianResolution: company.dianResolution
    } : {
      nombre: req.user.fiscalInfo?.nombre || req.user.name || 'MI NEGOCIO',
      nit: req.user.fiscalInfo?.numeroDocumento || req.user.fiscalInfo?.nit || process.env.DIAN_NIT || '900123456-7',
      direccion: req.user.fiscalInfo?.direccion || process.env.COMPANY_ADDRESS || 'Dirección',
      telefono: req.user.fiscalInfo?.telefono || process.env.COMPANY_PHONE || '',
      ciudad: req.user.fiscalInfo?.ciudad || process.env.COMPANY_CITY || 'Ciudad',
      mensaje: process.env.RECEIPT_MESSAGE || '¡Gracias por su compra!'
    };

    let pdfBase64 = null;
    try {
      const pdfBuffer = await PDFService.generateInvoicePDF(saleWithUser, companyInfo);
      pdfBase64 = pdfBuffer.toString('base64');
    } catch (pdfError) {
      console.error('Error generando PDF:', pdfError);
    }

    res.status(201).json({
      success: true,
      sale: saleWithUser,
      invoice,
      pdf: pdfBase64
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener todas las ventas
// @route   GET /api/sales
// @access  Privado
exports.getSales = async (req, res, next) => {
  try {
    const where = {};

    // Multi-tenancy: filtrar por empresa
    if (req.companyId) {
      where.companyId = req.companyId;
    }

    // Si es dueño/admin, puede ver todas las ventas de la empresa
    // Si es empleado/cliente, solo puede ver sus propias ventas
    if (req.user.role !== 'dueño' && req.user.role !== 'admin') {
      where.userId = req.user.id;
    }

    // Filtros opcionales
    if (req.query.status) {
      where.status = req.query.status;
    }

    if (req.query.paymentMethod) {
      where.paymentMethod = req.query.paymentMethod;
    }

    if (req.query.fechaInicio && req.query.fechaFin) {
      where.saleDate = {
        [Sequelize.Op.gte]: new Date(req.query.fechaInicio),
        [Sequelize.Op.lte]: new Date(req.query.fechaFin)
      };
    }

    const sales = await Sale.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
      ],
      order: [['saleDate', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: sales.length,
      sales
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener venta por ID
// @route   GET /api/sales/:id
// @access  Privado
exports.getSale = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    
    // Multi-tenancy: filtrar por empresa
    if (req.companyId) {
      where.companyId = req.companyId;
    }

    const sale = await Sale.findOne({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    // Verificar permisos
    if (req.user.role !== 'dueño' && req.user.role !== 'admin' && sale.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta venta'
      });
    }

    res.status(200).json({
      success: true,
      sale
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancelar venta
// @route   PUT /api/sales/:id/cancel
// @access  Privado (Dueño, Admin)
exports.cancelSale = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    
    // Multi-tenancy: filtrar por empresa
    if (req.companyId) {
      where.companyId = req.companyId;
    }

    const sale = await Sale.findOne({ where });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    if (sale.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'La venta ya está cancelada'
      });
    }

    sale.status = 'cancelled';
    sale.notes = (sale.notes || '') + '\n[CANCELADA]';
    await sale.save();

    res.status(200).json({
      success: true,
      sale,
      message: 'Venta cancelada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reembolsar venta
// @route   PUT /api/sales/:id/refund
// @access  Privado (Dueño, Admin)
exports.refundSale = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    
    // Multi-tenancy: filtrar por empresa
    if (req.companyId) {
      where.companyId = req.companyId;
    }

    const sale = await Sale.findOne({ where });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    if (sale.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'La venta ya está reembolsada'
      });
    }

    sale.status = 'refunded';
    sale.notes = (sale.notes || '') + '\n[REEMBOLSADA]';
    await sale.save();

    res.status(200).json({
      success: true,
      sale,
      message: 'Venta reembolsada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener estadísticas de ventas
// @route   GET /api/sales/stats
// @access  Privado (Dueño, Admin)
exports.getSaleStats = async (req, res, next) => {
  try {
    const { fechaInicio, fechaFin, periodo } = req.query;

    const where = { status: 'completed' };
    
    // Multi-tenancy: filtrar por empresa
    if (req.companyId) {
      where.companyId = req.companyId;
    }
    
    if (fechaInicio && fechaFin) {
      where.saleDate = {
        [Sequelize.Op.gte]: new Date(fechaInicio),
        [Sequelize.Op.lte]: new Date(fechaFin)
      };
    } else if (periodo) {
      const now = new Date();
      let startDate;
      
      switch (periodo) {
        case 'hoy':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'semana':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'mes':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'anio':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(now.setHours(0, 0, 0, 0));
      }
      
      where.saleDate = { [Sequelize.Op.gte]: startDate };
    }

    // Estadísticas generales
    const sales = await Sale.findAll({ where });
    
    const totalVentas = sales.length;
    const totalIngresos = sales.reduce((sum, s) => sum + parseFloat(s.total), 0);
    const totalSubtotal = sales.reduce((sum, s) => sum + parseFloat(s.subtotal), 0);
    const totalImpuestos = sales.reduce((sum, s) => sum + parseFloat(s.tax), 0);
    const promedioVenta = totalVentas > 0 ? totalIngresos / totalVentas : 0;
    const ventaMaxima = totalVentas > 0 ? Math.max(...sales.map(s => parseFloat(s.total))) : 0;
    const ventaMinima = totalVentas > 0 ? Math.min(...sales.map(s => parseFloat(s.total))) : 0;

    // Ventas por método de pago
    const pagoStats = {};
    sales.forEach(sale => {
      const method = sale.paymentMethod;
      if (!pagoStats[method]) {
        pagoStats[method] = { count: 0, total: 0 };
      }
      pagoStats[method].count++;
      pagoStats[method].total += parseFloat(sale.total);
    });
    
    const pagoStatsArray = Object.keys(pagoStats).map(method => ({
      _id: method,
      count: pagoStats[method].count,
      total: pagoStats[method].total,
      avgAmount: pagoStats[method].total / pagoStats[method].count
    }));

    // Ventas por estado
    const estadoStats = {};
    sales.forEach(sale => {
      const status = sale.status;
      if (!estadoStats[status]) {
        estadoStats[status] = 0;
      }
      estadoStats[status]++;
    });
    
    const estadoStatsArray = Object.keys(estadoStats).map(status => ({
      _id: status,
      count: estadoStats[status]
    }));

    // Productos más vendidos
    const productStats = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const key = `${item.productId}-${item.productName}`;
        if (!productStats[key]) {
          productStats[key] = {
            productId: item.productId,
            productName: item.productName,
            category: item.category,
            totalQuantity: 0,
            totalRevenue: 0
          };
        }
        productStats[key].totalQuantity += item.quantity;
        productStats[key].totalRevenue += item.subtotal;
      });
    });
    
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);

    // Ventas por hora del día
    const hourlyStats = {};
    sales.forEach(sale => {
      const hour = new Date(sale.saleDate).getHours();
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = { count: 0, total: 0 };
      }
      hourlyStats[hour].count++;
      hourlyStats[hour].total += parseFloat(sale.total);
    });
    
    const hourlyStatsArray = Object.keys(hourlyStats)
      .map(hour => ({ _id: parseInt(hour), ...hourlyStats[hour] }))
      .sort((a, b) => a._id - b._id);

    res.status(200).json({
      success: true,
      stats: {
        totalVentas,
        totalIngresos,
        totalSubtotal,
        totalImpuestos,
        promedioVenta,
        ventaMaxima,
        ventaMinima
      },
      pagoStats: pagoStatsArray,
      estadoStats: estadoStatsArray,
      topProducts,
      hourlyStats: hourlyStatsArray
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener ventas del día actual
// @route   GET /api/sales/today
// @access  Privado
exports.getTodaySales = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where = {
      saleDate: {
        [Sequelize.Op.gte]: today,
        [Sequelize.Op.lt]: tomorrow
      }
    };

    // Multi-tenancy: filtrar por empresa
    if (req.companyId) {
      where.companyId = req.companyId;
    }

    if (req.user.role !== 'dueño' && req.user.role !== 'admin') {
      where.userId = req.user.id;
    }

    const sales = await Sale.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
      ],
      order: [['saleDate', 'DESC']]
    });

    const total = sales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);

    res.status(200).json({
      success: true,
      count: sales.length,
      total,
      sales
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generar PDF de venta
// @route   GET /api/sales/:id/pdf
// @access  Privado
exports.generateSalePDF = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    
    // Multi-tenancy: filtrar por empresa
    if (req.companyId) {
      where.companyId = req.companyId;
    }

    const sale = await Sale.findOne({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    // Verificar permisos
    if (req.user.role !== 'dueño' && req.user.role !== 'admin' && sale.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta venta'
      });
    }

    // Obtener company info
    let company = null;
    if (req.companyId) {
      company = await Company.findByPk(req.companyId);
    }

    const companyInfo = company ? {
      nombre: company.name,
      nit: company.nit + (company.dv ? '-' + company.dv : ''),
      direccion: company.address,
      telefono: company.phone,
      ciudad: company.city,
      mensaje: company.settings?.mensaje || '¡Gracias por su compra!',
      dianResolution: company.dianResolution
    } : {
      nombre: req.user.fiscalInfo?.nombre || req.user.name || 'MI NEGOCIO',
      nit: req.user.fiscalInfo?.numeroDocumento || req.user.fiscalInfo?.nit || process.env.DIAN_NIT || '900123456-7',
      direccion: req.user.fiscalInfo?.direccion || process.env.COMPANY_ADDRESS || 'Dirección',
      telefono: req.user.fiscalInfo?.telefono || process.env.COMPANY_PHONE || '',
      ciudad: req.user.fiscalInfo?.ciudad || process.env.COMPANY_CITY || 'Ciudad',
      mensaje: process.env.RECEIPT_MESSAGE || '¡Gracias por su compra!'
    };

    const format = req.query.format || 'thermal'; // thermal o a4

    try {
      let pdfBuffer;
      if (format === 'a4') {
        pdfBuffer = await PDFService.generateInvoicePDFA4(sale, companyInfo);
      } else {
        pdfBuffer = await PDFService.generateInvoicePDF(sale, companyInfo);
      }

      const pdfBase64 = pdfBuffer.toString('base64');

      res.status(200).json({
        success: true,
        pdf: pdfBase64,
        format: format,
        saleNumber: sale.saleNumber
      });
    } catch (pdfError) {
      console.error('Error generando PDF:', pdfError);
      res.status(500).json({
        success: false,
        message: 'Error generando PDF',
        error: pdfError.message
      });
    }
  } catch (error) {
    next(error);
  }
};
