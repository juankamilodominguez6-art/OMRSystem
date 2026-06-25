const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Company = require('./Company');
const Category = require('./Category');

const Product = sequelize.define('Product', {
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
  categoryId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Categories',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  sku: {
    type: DataTypes.STRING(50),
    unique: true
  },
  barcode: {
    type: DataTypes.STRING(50)
  },
  image: {
    type: DataTypes.STRING
  },
  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  cost: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  minStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  maxStock: {
    type: DataTypes.INTEGER
  },
  taxRate: {
    type: DataTypes.DECIMAL(5, 4),
    defaultValue: 0.19
  },
  unit: {
    type: DataTypes.ENUM('unidad', 'kg', 'g', 'lb', 'oz', 'm', 'cm', 'l', 'ml', 'paquete', 'caja', 'docena'),
    defaultValue: 'unidad'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isService: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true
});

// Asociaciones
Product.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Company.hasMany(Product, { foreignKey: 'companyId', as: 'products' });
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });

module.exports = Product;
