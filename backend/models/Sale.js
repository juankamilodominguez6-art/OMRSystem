const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Company = require('./Company');

const Sale = sequelize.define('Sale', {
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
  saleNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  customer: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  items: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  taxRate: {
    type: DataTypes.DECIMAL(5, 4),
    defaultValue: 0.19
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'card', 'credit', 'transfer'),
    allowNull: false
  },
  paidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  changeAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('completed', 'cancelled', 'refunded'),
    defaultValue: 'completed'
  },
  notes: {
    type: DataTypes.TEXT
  },
  invoiceId: {
    type: DataTypes.INTEGER
  },
  saleDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (sale) => {
      // Calcular totales
      let subtotal = 0;
      const items = sale.items || [];
      items.forEach(item => {
        item.subtotal = item.quantity * item.unitPrice;
        subtotal += item.subtotal;
      });
      sale.subtotal = subtotal;
      sale.tax = subtotal * sale.taxRate;
      sale.total = subtotal + sale.tax;
      
      // Calcular cambio si es efectivo
      if (sale.paymentMethod === 'cash') {
        sale.changeAmount = Math.max(0, sale.paidAmount - sale.total);
      }
      
      // Generar número de venta por empresa
      if (!sale.saleNumber) {
        const lastSale = await Sale.findOne({
          where: { companyId: sale.companyId },
          order: [['saleNumber', 'DESC']]
        });
        sale.saleNumber = lastSale ? lastSale.saleNumber + 1 : 1;
      }
    },
    beforeUpdate: async (sale) => {
      if (sale.changed('items') || sale.changed('taxRate') || sale.changed('paidAmount')) {
        let subtotal = 0;
        const items = sale.items || [];
        items.forEach(item => {
          item.subtotal = item.quantity * item.unitPrice;
          subtotal += item.subtotal;
        });
        sale.subtotal = subtotal;
        sale.tax = subtotal * sale.taxRate;
        sale.total = subtotal + sale.tax;
        
        if (sale.paymentMethod === 'cash') {
          sale.changeAmount = Math.max(0, sale.paidAmount - sale.total);
        }
      }
    }
  }
});

// Método estático para generar número de venta
Sale.getNextSaleNumber = async function(companyId) {
  const lastSale = await this.findOne({
    where: { companyId },
    order: [['saleNumber', 'DESC']]
  });
  return lastSale ? lastSale.saleNumber + 1 : 1;
};

// Asociaciones
Sale.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Sale.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(Sale, { foreignKey: 'companyId', as: 'sales' });

module.exports = Sale;
