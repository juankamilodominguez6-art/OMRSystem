const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: { notEmpty: { msg: 'Por favor ingrese el nombre de la empresa' } }
  },
  nit: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: { notEmpty: { msg: 'Por favor ingrese el NIT' } }
  },
  dv: {
    type: DataTypes.STRING(1),
    defaultValue: '1'
  },
  address: {
    type: DataTypes.STRING(300),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  email: {
    type: DataTypes.STRING
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  department: {
    type: DataTypes.STRING(100)
  },
  taxRegime: {
    type: DataTypes.ENUM('01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '48', '49'),
    defaultValue: '48' // Régimen Común
  },
  dianResolution: {
    type: DataTypes.JSON,
    defaultValue: {
      number: '',
      date: null,
      prefix: 'FV',
      from: 1,
      to: 999999999,
      technicalKey: ''
    }
  },
  logo: {
    type: DataTypes.STRING
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      currency: 'COP',
      taxRate: 0.19,
      receiptWidth: 80,
      defaultPaymentMethod: 'cash'
    }
  }
}, {
  timestamps: true
});

module.exports = Company;
