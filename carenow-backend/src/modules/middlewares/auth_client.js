const jwt = require('jsonwebtoken');
const repo = require('../patient/patient.repository');

/**
 * Middleware xác thực bệnh nhân (carenow-client).
 * Yêu cầu Bearer token có payload { patient_id, type: 'patient' }.
 * Token này được ký bởi /auth/client/google-login.
 *
 * Sau khi pass: req.patient = { id, ... } để controller dùng.
 */
module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res
        .status(401)
        .json({ success: false, message: 'Thiếu Bearer token' });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    if (payload.type !== 'patient' || !payload.patient_id) {
      return res
        .status(403)
        .json({ success: false, message: 'Token không thuộc về bệnh nhân' });
    }

    // (tuỳ chọn) load patient từ DB để chặn user đã bị khoá / đã xoá
    const patient = await repo.findById(payload.patient_id);
    if (!patient) {
      return res
        .status(401)
        .json({ success: false, message: 'Tài khoản không tồn tại' });
    }
    if (patient.is_active === false) {
      return res
        .status(403)
        .json({ success: false, message: 'Tài khoản đã bị khoá' });
    }

    req.patient = patient;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
