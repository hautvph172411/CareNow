const jwt = require('jsonwebtoken');
const repo = require('../patient/patient.repository');

/**
 * Middleware xác thực tùy chọn cho bệnh nhân (carenow-client).
 * - Nếu có Bearer token hợp lệ → req.patient = { id, ... }
 * - Nếu không có token / token sai → req.patient = null (tiếp tục như guest)
 */
module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      req.patient = null;
      return next();
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      req.patient = null;
      return next();
    }

    if (payload.type !== 'patient' || !payload.patient_id) {
      req.patient = null;
      return next();
    }

    const patient = await repo.findById(payload.patient_id);
    req.patient = (patient && patient.is_active !== false) ? patient : null;
    return next();
  } catch {
    req.patient = null;
    return next();
  }
};
