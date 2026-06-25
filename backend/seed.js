const dotenv = require('dotenv');
const { connectDB } = require('./config/database');
const { sequelize } = require('./config/database');

// Cargar variables de entorno
dotenv.config();

// Función para sembrar la base de datos
const seedDatabase = async () => {
  try {
    // Importar modelos como server.js
    require('./models/Company');
    require('./models/User');
    require('./models/Sale');
    require('./models/Invoice');

    // Conectar a la base de datos (forzar sincronización para recrear tablas)
    await connectDB(true);

    // Importar modelos después de conectar
    const Company = require('./models/Company');
    const User = require('./models/User');

    console.log('Iniciando siembra de la base de datos...');

    // 1. Crear empresa
    console.log('1. Creando empresa...');
    let company = await Company.findOne({ where: { nit: '900123456' } });
    if (!company) {
      company = await Company.create({
        name: 'OMR System SAS',
        nit: '900123456',
        dv: '7',
        address: 'Calle Principal #123',
        phone: '+57 300 123 4567',
        email: 'contacto@omrsystem.com',
        city: 'Bogotá',
        department: 'Cundinamarca',
        taxRegime: '48',
        dianResolution: {
          number: '18764000000001',
          date: new Date().toISOString(),
          prefijo: 'FV',
          from: 1,
          to: 999999999,
          technicalKey: ''
        },
        settings: {
          currency: 'COP',
          taxRate: 0.19,
          receiptWidth: 80,
          defaultPaymentMethod: 'cash'
        },
        isActive: true
      });
      console.log('✅ Empresa creada:', company.name);
    } else {
      // Actualizar empresa existente
      company.name = 'OMR System SAS';
      company.email = 'contacto@omrsystem.com';
      await company.save();
      console.log('✅ Empresa actualizada:', company.name);
    }

    // 2. Crear usuarios
    const seedUsers = [
      {
        companyId: company.id,
        name: 'Dueño Sistema',
        email: 'dueno@omr.com',
        password: 'dueno123',
        role: 'dueño',
        status: 'activo',
        isActive: true,
        fiscalInfo: {
          tipoDocumento: 'NIT',
          numeroDocumento: company.nit,
          direccion: company.address,
          telefono: company.phone,
          ciudad: company.city
        }
      },
      {
        companyId: company.id,
        name: 'Admin OMR',
        email: 'admin@omr.com',
        password: 'admin123',
        role: 'admin',
        status: 'activo',
        isActive: true,
        fiscalInfo: {
          tipoDocumento: 'CC',
          numeroDocumento: '123456789',
          direccion: 'Calle Secundaria #456',
          telefono: '+57 310 987 6543',
          ciudad: 'Medellín'
        }
      },
      {
        companyId: company.id,
        name: 'Empleado Prueba',
        email: 'empleado@omr.com',
        password: 'empleado123',
        role: 'empleado',
        status: 'pendiente',
        isActive: false,
        fiscalInfo: {
          tipoDocumento: 'CC',
          numeroDocumento: '987654321',
          direccion: 'Calle Tercera #789',
          telefono: '+57 320 456 7890',
          ciudad: 'Cali'
        }
      }
    ];

    console.log('\n2. Creando usuarios...');
    for (const seedUserData of seedUsers) {
      const existingUser = await User.findOne({ where: { email: seedUserData.email } });
      
      if (existingUser) {
        console.log(`ℹ️  Usuario ${seedUserData.email} ya existe. Actualizando...`);
        // Actualizar usuario existente
        await User.update(
          { ...seedUserData, password: seedUserData.password }, // Password will be hashed by model hook
          { where: { email: seedUserData.email } }
        );
        console.log(`✅ Usuario ${seedUserData.email} actualizado.`);
      } else {
        const user = await User.create(seedUserData);
        console.log(`✅ Usuario creado exitosamente: ${seedUserData.email}`);
      }
    }

    console.log('\n📋 Resumen de la siembra:');
    console.log('✅ Empresa:', company.name);
    console.log('✅ Usuarios:');
    seedUsers.forEach(userData => {
      console.log(`   - ${userData.email} / ${userData.password} (Rol: ${userData.role})`);
    });
    console.log('\n⚠️  IMPORTANTE: Cambie las contraseñas después del primer inicio de sesión por seguridad.');
    console.log('✅ Siembra completada!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la siembra:', error);
    process.exit(1);
  }
};

// Ejecutar el seed
seedDatabase();
