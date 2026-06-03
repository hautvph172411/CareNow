const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const repo = require('./patient.repository');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify Google ID token và đăng nhập / đăng ký bệnh nhân.
 * @param {string} idToken - ID token từ Google Sign-In
 * @returns {Promise<{ token, patient, isNewUser }>}
 */
exports.loginWithGoogle = async (idToken) => {
  if (!idToken) throw new Error('Thiếu Google ID token');
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error('Server chưa cấu hình GOOGLE_CLIENT_ID');
  }

  // Verify token với Google
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    throw new Error('Google ID token không hợp lệ hoặc đã hết hạn');
  }

  const { sub: googleId, email, name, picture, email_verified } = payload;

  if (!email_verified) {
    throw new Error('Email Google chưa được xác minh');
  }

  // Tìm theo google_id trước → fallback theo email
  let patient = await repo.findByGoogleId(googleId);
  let isNewUser = false;

  if (!patient) {
    const existedByEmail = await repo.findByEmail(email);
    if (existedByEmail) {
      // Đã có account nhưng chưa link Google → link luôn
      patient = await repo.updateById(existedByEmail.id, {
        google_id: googleId,
        google_email: email,
        avatar_url: picture || existedByEmail.avatar_url,
      });
    } else {
      // Tạo mới
      patient = await repo.create({
        google_id: googleId,
        google_email: email,
        email,
        full_name: name || email.split('@')[0],
        avatar_url: picture,
        is_verified: true, // Google đã verify email rồi
      });
      isNewUser = true;
    }
  }

  if (patient.is_active === false) {
    throw new Error('Tài khoản đã bị khoá. Vui lòng liên hệ hỗ trợ.');
  }

  await repo.touchLastLogin(patient.id);

  // Ký JWT với type='patient' để middleware phân biệt với token admin
  const token = jwt.sign(
    { patient_id: patient.id, type: 'patient' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_PATIENT_EXPIRES || '30d' }
  );

  return { token, patient, isNewUser };
};

exports.getById = async (id) => {
  const patient = await repo.findById(id);
  if (!patient) throw new Error('Không tìm thấy bệnh nhân');
  return patient;
};

const ALLOWED_UPDATE_FIELDS = [
  'full_name', 'phone', 'date_of_birth', 'gender',
  'avatar_url',                               // patient có thể đổi avatar (Cloudinary URL)
  'address', 'province_id', 'ward_id',        // địa chỉ — FK sang tbl_location_*
  'blood_type', 'allergies', 'medical_history', 'insurance_code',
  'emergency_contact_name', 'emergency_contact_phone',
];

/** Các field phải convert sang INTEGER (PG sẽ throw nếu nhận chuỗi rỗng) */
const NUMERIC_FIELDS = new Set(['province_id', 'ward_id']);

exports.updateProfile = async (id, data) => {
  const patient = await repo.findById(id);
  if (!patient) throw new Error('Không tìm thấy bệnh nhân');

  // Chỉ cho phép update các trường an toàn (không cho update google_id, is_active...)
  const safeData = {};
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (data[key] === undefined) continue;
    let value = data[key];

    // Numeric fields: '' -> null, string số -> int
    if (NUMERIC_FIELDS.has(key)) {
      if (value === '' || value === null) {
        value = null;
      } else {
        const n = parseInt(value, 10);
        if (Number.isNaN(n)) {
          throw new Error(`Giá trị không hợp lệ cho ${key}`);
        }
        value = n;
      }
    }

    safeData[key] = value;
  }

  if (Object.keys(safeData).length === 0) {
    throw new Error('Không có trường nào hợp lệ để cập nhật');
  }

  return await repo.updateById(id, safeData);
};

exports.list = async (query) => {
  return await repo.getAll(query);
};
