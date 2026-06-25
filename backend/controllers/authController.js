const User = require('../models/User');
const Company = require('../models/Company');
const crypto = require('crypto');

// @desc    Registrar usuario
// @route   POST /api/auth/register
// @access  Público
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, fiscalInfo, companyName, companyNit, companyId } = req.body;

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Obtener la empresa principal (OMR)
    let omrCompany = await Company.findOne({ where: { nit: '900123456' } });
    
    if (!omrCompany) {
      // Crear empresa OMR si no existe
      omrCompany = await Company.create({
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
    }

    let userRole = 'cliente';
    let isActive = false;
    let status = 'pendiente';

    // Si es el dueño principal, activar inmediatamente
    if (email === 'dueno@omr.com') {
      userRole = 'dueño';
      isActive = true;
      status = 'activo';
    } else {
      userRole = role === 'empleado' ? 'empleado' : 'cliente';
      isActive = false;
      status = 'pendiente';
    }

    // Crear usuario
    const user = await User.create({
      companyId: omrCompany.id,
      name,
      email,
      password,
      role: userRole,
      status,
      isActive,
      fiscalInfo: fiscalInfo || {}
    });

    // Solo generar token si el usuario está activo
    let token = null;
    if (isActive) {
      token = user.getSignedJwtToken();
    }

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isActive: user.isActive,
        companyId: user.companyId
      },
      company: {
        id: omrCompany.id,
        name: omrCompany.name
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Solicitar restablecimiento de contraseña
// @route   POST /api/auth/forgot-password
// @access  Público
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Verificar si el usuario existe
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró un usuario con ese email'
      });
    }

    // Generar token de restablecimiento
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash del token y guardar en la BD
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Establecer expiración (10 minutos)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    // En este punto, normalmente enviaríamos un email con el token
    // Por ahora, devolvemos el token para pruebas
    res.status(200).json({
      success: true,
      message: 'Token de restablecimiento generado',
      resetToken // En producción, NO devuelvas esto - envía por email
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restablecer contraseña
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Público
exports.resetPassword = async (req, res, next) => {
  try {
    // Obtener token hasheado
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    // Buscar usuario con token válido y no expirado
    const user = await User.findOne({
      where: {
        resetPasswordToken,
        resetPasswordExpire: { [require('sequelize').Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    // Establecer nueva contraseña
    user.password = req.body.password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save();

    // Generar nuevo token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      message: 'Contraseña restablecida exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Iniciar sesión
// @route   POST /api/auth/login
// @access  Público
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validar email y password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione email y contraseña'
      });
    }

    // Verificar si el usuario existe
    const user = await User.findOne({ 
      where: { email },
      include: [{ model: Company, as: 'company' }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si el usuario está activo
    if (!user.isActive || user.status === 'suspendido' || user.status === 'bloqueado') {
      const statusMessage = user.status === 'suspendido' 
        ? 'Usuario suspendido. Contacte al administrador.' 
        : user.status === 'bloqueado' 
          ? 'Usuario bloqueado. Contacte al administrador.' 
          : 'Usuario desactivado. Contacte al administrador.';
      return res.status(401).json({
        success: false,
        message: statusMessage
      });
    }

    // Verificar si el usuario está pendiente de autorización
    if (user.status === 'pendiente') {
      return res.status(401).json({
        success: false,
        message: 'Cuenta pendiente de autorización. Por favor espere la aprobación del administrador.'
      });
    }

    // Verificar contraseña
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Actualizar último login
    user.lastLogin = Date.now();
    await user.save();

    // Generar token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isActive: user.isActive,
        companyId: user.companyId,
        fiscalInfo: user.fiscalInfo,
        company: user.company ? {
          id: user.company.id,
          name: user.company.name
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener usuario actual
// @route   GET /api/auth/me
// @access  Privado
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] },
      include: [{ model: Company, as: 'company' }]
    });

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar información fiscal del usuario
// @route   PUT /api/auth/fiscal-info
// @access  Privado
exports.updateFiscalInfo = async (req, res, next) => {
  try {
    const { tipoDocumento, numeroDocumento, direccion, telefono, ciudad } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    user.fiscalInfo = {
      tipoDocumento: tipoDocumento || user.fiscalInfo.tipoDocumento,
      numeroDocumento: numeroDocumento || user.fiscalInfo.numeroDocumento,
      direccion: direccion || user.fiscalInfo.direccion,
      telefono: telefono || user.fiscalInfo.telefono,
      ciudad: ciudad || user.fiscalInfo.ciudad
    };

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        fiscalInfo: user.fiscalInfo
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cerrar sesión (opcional - JWT stateless)
// @route   POST /api/auth/logout
// @access  Privado
exports.logout = async (req, res, next) => {
  // En una implementación con JWT stateless, el logout es manejado en el cliente
  // eliminando el token. Aquí podemos implementar blacklist si es necesario.

  res.status(200).json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
};
