const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Company = require('./Company');

const Customer = sequelize.define('Customer', {
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
    type: DataTypes.STRING(200),
    allowNull: false
  },
  documentType: {
    type: DataTypes.ENUM('CC', 'CE', 'NIT', 'TI', 'PP', 'DNI'),
    defaultValue: 'CC'
  },
  documentNumber: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  dv: {
    type: DataTypes.STRING(1)
  },
  address: {
    type: DataTypes.STRING(300)
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  email: {
    type: DataTypes.STRING
  },
  city: {
    type: DataTypes.STRING(100)
  },
  department: {
    type: DataTypes.STRING(100)
  },
  taxRegime: {
    type: DataTypes.ENUM('01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '48', '49'),
    defaultValue: '49' // Régimen Simplificado
  },
  creditLimit: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  currentDebt: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true
});

// Asociaciones
Customer.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(Customer, { foreignKey: 'companyId', as: 'customers' });

module.exports = Customer;
