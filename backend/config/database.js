const { Sequelize } = require('sequelize');
const path = require('path');

// Configuración de SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: false,
  }
});

const connectDB = async (force = false) => {
  try {
    await sequelize.authenticate();
    console.log('SQLite Conectado exitosamente');
    
    // Sincronizar modelos (crear tablas)
    await sequelize.sync({ force });
    console.log('Base de datos sincronizada');
  } catch (error) {
    console.error('Error conectando a SQLite:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
