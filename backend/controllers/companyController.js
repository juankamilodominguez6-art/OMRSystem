const Company = require('../models/Company');

// @desc    Obtener todas las empresas activas
// @route   GET /api/companies
// @access  Público
exports.getCompanies = async (req, res, next) => {
  try {
    const companies = await Company.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'nit', 'city']
    });

    res.status(200).json({
      success: true,
      count: companies.length,
      companies
    });
  } catch (error) {
    next(error);
  }
};
