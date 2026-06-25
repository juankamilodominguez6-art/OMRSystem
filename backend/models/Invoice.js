const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Company = require('./Company');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Companies',
      key: 'id'
    }
  },
  consecutivo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  prefijo: {
    type: DataTypes.STRING,
    defaultValue: 'FV'
  },
  emisor: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  },
  adquiriente: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  },
  fechaEmision: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  items: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  baseImponible: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  ivaTotal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  incTotal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  formaPago: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  estado: {
    type: DataTypes.ENUM('emitida', 'anulada'),
    defaultValue: 'emitida'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  observaciones: {
    type: DataTypes.TEXT
  },
  moneda: {
    type: DataTypes.STRING,
    defaultValue: 'COP'
  },
  cufe: {
    type: DataTypes.TEXT // CUFE - Código Único de Factura Electrónica
  },
  dianStatus: {
    type: DataTypes.ENUM('pendiente', 'enviada', 'aceptada', 'rechazada'),
    defaultValue: 'pendiente'
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (invoice) => {
      // Calcular totales
      let subtotal = 0;
      let baseImponible = 0;
      let ivaTotal = 0;
      let incTotal = 0;
      
      const items = invoice.items || [];
      items.forEach(item => {
        item.ivaValor = item.valorUnitario * item.cantidad * (item.ivaTarifa / 100);
        item.incValor = item.valorUnitario * item.cantidad * (item.incTarifa / 100);
        item.valorTotal = (item.valorUnitario * item.cantidad) + item.ivaValor + item.incValor;
        
        subtotal += item.valorUnitario * item.cantidad;
        baseImponible += item.valorUnitario * item.cantidad;
        ivaTotal += item.ivaValor;
        incTotal += item.incValor;
      });
      
      invoice.subtotal = subtotal;
      invoice.baseImponible = baseImponible;
      invoice.ivaTotal = ivaTotal;
      invoice.incTotal = incTotal;
      invoice.total = subtotal + ivaTotal + incTotal;
      
      // Generar consecutivo por empresa y prefijo
      if (!invoice.consecutivo) {
        const lastInvoice = await Invoice.findOne({
          where: { companyId: invoice.companyId, prefijo: invoice.prefijo },
          order: [['consecutivo', 'DESC']]
        });
        invoice.consecutivo = lastInvoice ? lastInvoice.consecutivo + 1 : 1;
      }
    }
  }
});

// Método estático para generar consecutivo
Invoice.getNextConsecutivo = async function(companyId, prefijo = 'FV') {
  const lastInvoice = await this.findOne({ 
    where: { companyId, prefijo },
    order: [['consecutivo', 'DESC']] 
  });
  return lastInvoice ? lastInvoice.consecutivo + 1 : 1;
};

// Asociaciones
Invoice.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Invoice.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(Invoice, { foreignKey: 'companyId', as: 'invoices' });

module.exports = Invoice;
