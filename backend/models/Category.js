const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Company = require('./Company');

const Category = sequelize.define('Category', {
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  color: {
    type: DataTypes.STRING(7)
  },
  icon: {
    type: DataTypes.STRING(50)
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true
});

// Asociaciones
Category.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(Category, { foreignKey: 'companyId', as: 'categories' });

module.exports = Category;
