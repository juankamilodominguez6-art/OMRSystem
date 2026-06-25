const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const Company = require('./Company');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Companies',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Por favor ingrese el nombre' },
      len: { args: [0, 100], msg: 'El nombre no puede exceder 100 caracteres' }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Por favor ingrese el email' },
      isEmail: { msg: 'Por favor ingrese un email válido' }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Por favor ingrese la contraseña' },
      len: { args: [6, 255], msg: 'La contraseña debe tener al menos 6 caracteres' }
    }
  },
  role: {
    type: DataTypes.ENUM('dueño', 'admin', 'cliente', 'empleado'),
    defaultValue: 'cliente'
  },
  status: {
    type: DataTypes.ENUM('activo', 'suspendido', 'bloqueado', 'pendiente'),
    defaultValue: 'pendiente'
  },
  fiscalInfo: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false // Cambiado a false para requerir autorización
  },
  lastLogin: {
    type: DataTypes.DATE
  },
  resetPasswordToken: {
    type: DataTypes.STRING
  },
  resetPasswordExpire: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Método para comparar contraseñas
User.prototype.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Método para generar JWT token
User.prototype.getSignedJwtToken = function() {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: this.id, role: this.role, companyId: this.companyId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Asociaciones
User.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(User, { foreignKey: 'companyId', as: 'users' });

module.exports = User;
