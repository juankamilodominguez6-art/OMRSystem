const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');

// Proteger rutas - Verificar token JWT
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado para acceder a esta ruta'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = await User.findByPk(decoded.id, {
      include: [{ model: Company, as: 'company' }]
    });
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!req.user.isActive || req.user.status === 'suspendido' || req.user.status === 'bloqueado' || req.user.status === 'pendiente') {
      const statusMessage = req.user.status === 'suspendido' 
        ? 'Usuario suspendido' 
        : req.user.status === 'bloqueado' 
          ? 'Usuario bloqueado' 
          : req.user.status === 'pendiente'
            ? 'Cuenta pendiente de autorización'
            : 'Usuario desactivado';
      return res.status(401).json({
        success: false,
        message: statusMessage
      });
    }

    // Añadir companyId a la solicitud para multi-tenancy (default to 1 if not set)
    req.companyId = req.user.companyId || 1;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado'
    });
  }
};

// Verificar roles de usuario
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `El usuario con rol ${req.user.role} no está autorizado para acceder a esta ruta`
      });
    }
    next();
  };
};
