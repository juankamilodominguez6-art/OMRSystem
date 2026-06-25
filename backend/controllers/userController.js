const User = require('../models/User');
const Company = require('../models/Company');

// Middleware to check if user is the main owner (dueno@omr.com)
const isMainOwner = (req) => req.user.email === 'dueno@omr.com';

// @desc    Obtener todos los usuarios (Solo Dueño Principal)
// @route   GET /api/users
// @access  Privado
exports.getUsers = async (req, res, next) => {
  try {
    if (!isMainOwner(req)) {
      return res.status(403).json({
        success: false,
        message: 'Solo el dueño principal puede acceder a esta ruta'
      });
    }

    const users = await User.findAll({
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] }
    });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener usuarios pendientes de autorización (Solo Dueño Principal)
// @route   GET /api/users/pending
// @access  Privado
exports.getPendingUsers = async (req, res, next) => {
  try {
    if (!isMainOwner(req)) {
      return res.status(403).json({
        success: false,
        message: 'Solo el dueño principal puede acceder a esta ruta'
      });
    }

    const users = await User.findAll({
      where: { status: 'pendiente' },
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] }
    });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Autorizar usuario pendiente (Solo Dueño Principal)
// @route   PUT /api/users/:id/authorize
// @access  Privado
exports.authorizeUser = async (req, res, next) => {
  try {
    if (!isMainOwner(req)) {
      return res.status(403).json({
        success: false,
        message: 'Solo el dueño principal puede autorizar usuarios'
      });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    user.isActive = true;
    user.status = 'activo';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Usuario autorizado exitosamente',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener un usuario por ID (Solo Dueño Principal)
// @route   GET /api/users/:id
// @access  Privado
exports.getUser = async (req, res, next) => {
  try {
    if (!isMainOwner(req)) {
      return res.status(403).json({
        success: false,
        message: 'Solo el dueño principal puede acceder a esta ruta'
      });
    }

    const user = await User.findOne({
      where: { id: req.params.id },
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Crear usuario (Solo Dueño Principal)
// @route   POST /api/users
// @access  Privado
exports.createUser = async (req, res, next) => {
  try {
    if (!isMainOwner(req)) {
      return res.status(403).json({
        success: false,
        message: 'Solo el dueño principal puede crear usuarios'
      });
    }

    const { name, email, password, role, fiscalInfo, isActive, status } = req.body;

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Obtener la empresa principal
    let omrCompany = await Company.findOne({ where: { nit: '900123456' } });

    const user = await User.create({
      companyId: omrCompany.id,
      name,
      email,
      password,
      role: role || 'cliente',
      fiscalInfo: fiscalInfo || {},
      isActive: isActive !== undefined ? isActive : false,
      status: status || 'pendiente'
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        fiscalInfo: user.fiscalInfo,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar usuario (Solo Dueño Principal)
// @route   PUT /api/users/:id
// @access  Privado
exports.updateUser = async (req, res, next) => {
  try {
    if (!isMainOwner(req)) {
      return res.status(403).json({
        success: false,
        message: 'Solo el dueño principal puede actualizar usuarios'
      });
    }

    const { name, email, role, fiscalInfo, isActive, status } = req.body;

    let user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Prevenir que el dueño se desactive a sí mismo
    if (user.id === req.user.id && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propio usuario'
      });
    }

    // Actualizar campos
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (fiscalInfo) user.fiscalInfo = { ...user.fiscalInfo, ...fiscalInfo };
    if (isActive !== undefined) user.isActive = isActive;
    if (status) user.status = status;

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        fiscalInfo: user.fiscalInfo,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar usuario (Solo Dueño Principal)
// @route   DELETE /api/users/:id
// @access  Privado
exports.deleteUser = async (req, res, next) => {
  try {
    if (!isMainOwner(req)) {
      return res.status(403).json({
        success: false,
        message: 'Solo el dueño principal puede eliminar usuarios'
      });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Prevenir que el dueño se elimine a sí mismo
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propio usuario'
      });
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cambiar contraseña (Usuario actual)
// @route   PUT /api/users/change-password
// @access  Privado
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione la contraseña actual y la nueva'
      });
    }

    const user = await User.findByPk(req.user.id);

    // Verificar contraseña actual
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Validar nueva contraseña
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    user.password = newPassword;
    await user.save();

    // Generar nuevo token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener información de la empresa del usuario
// @route   GET /api/users/company
// @access  Privado
exports.getUserCompany = async (req, res, next) => {
  try {
    if (!req.user.companyId) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no tiene empresa asignada'
      });
    }

    const company = await Company.findByPk(req.user.companyId);

    res.status(200).json({
      success: true,
      company
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar información de la empresa
// @route   PUT /api/users/company
// @access  Privado (Solo Dueño Principal)
exports.updateUserCompany = async (req, res, next) => {
  try {
    if (!isMainOwner(req)) {
      return res.status(403).json({
        success: false,
        message: 'Solo el dueño principal puede actualizar la información de la empresa'
      });
    }

    if (!req.user.companyId) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no tiene empresa asignada'
      });
    }

    const company = await Company.findByPk(req.user.companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    const { name, nit, dv, address, phone, email, city, department, taxRegime, dianResolution, settings } = req.body;

    if (name) company.name = name;
    if (nit) company.nit = nit;
    if (dv) company.dv = dv;
    if (address) company.address = address;
    if (phone) company.phone = phone;
    if (email) company.email = email;
    if (city) company.city = city;
    if (department) company.department = department;
    if (taxRegime) company.taxRegime = taxRegime;
    if (dianResolution) company.dianResolution = { ...company.dianResolution, ...dianResolution };
    if (settings) company.settings = { ...company.settings, ...settings };

    await company.save();

    res.status(200).json({
      success: true,
      message: 'Empresa actualizada exitosamente',
      company
    });
  } catch (error) {
    next(error);
  }
};
