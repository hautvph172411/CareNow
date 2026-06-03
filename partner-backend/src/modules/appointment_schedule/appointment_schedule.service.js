const repo = require('./appointment_schedule.repository');
const pool = require('../../config/database');

const now = () => Math.floor(Date.now() / 1000);

const parseIntOr = (v, d) => {
  if (v === '' || v === undefined || v === null) return d;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? d : n;
};

const nullIfEmpty = (v) => (v === '' || v === undefined ? null : v);

const buildBlockPayload = (body, isCreate) => {
  const o = {
    clinic_id: parseIntOr(body.clinic_id, null),
    partner_id: parseIntOr(body.partner_id, null),
    clinic_place_id: parseIntOr(body.clinic_place_id, null),
    day_of_week: parseIntOr(body.day_of_week, null),
    session_type: parseIntOr(body.session_type, null),
    start_time: body.start_time,
    end_time: body.end_time,
    slot_step_minutes: parseIntOr(body.slot_step_minutes, 30),
    appointment_duration_minutes: parseIntOr(body.appointment_duration_minutes, 30),
    cutoff_minutes_before_slot: parseIntOr(body.cutoff_minutes_before_slot, 30),
    valid_from: nullIfEmpty(body.valid_from),
    valid_to: nullIfEmpty(body.valid_to),
    default_price_package_id:
      body.default_price_package_id === '' || body.default_price_package_id == null
        ? null
        : parseInt(body.default_price_package_id, 10),
    default_insurance_package_id:
      body.default_insurance_package_id === '' || body.default_insurance_package_id == null
        ? null
        : parseInt(body.default_insurance_package_id, 10),
    status: parseIntOr(body.status, 1),
    rank: parseIntOr(body.rank, 99),
  };

  if (isCreate) o.created_at = now();
  o.updated_at = now();

  return o;
};

const validateBlock = (o) => {
  if (!o.clinic_id) throw new Error('Thiếu bác sĩ (clinic_id)');
  if (!o.partner_id) throw new Error('Thiếu đối tác (partner_id)');
  if (!o.clinic_place_id) throw new Error('Thiếu nơi khám (clinic_place_id)');
  if (o.day_of_week === null || o.day_of_week < 0 || o.day_of_week > 6) {
    throw new Error('Thứ trong tuần (day_of_week) từ 0–6');
  }
  if (!o.session_type || o.session_type < 1 || o.session_type > 4) {
    throw new Error('Buổi (session_type) từ 1–4');
  }
  if (!o.start_time || !o.end_time) throw new Error('Thiếu start_time hoặc end_time');
};

exports.getBlocks = async (query) => {
  const limit = query.limit ? parseInt(query.limit, 10) : 20;
  const page = query.page ? parseInt(query.page, 10) : 1;
  const offset = (page - 1) * limit;

  const filters = {
    limit,
    offset,
    clinic_id: query.clinic_id,
    partner_id: query.partner_id,
    clinic_place_id: query.clinic_place_id,
    status: query.status,
    day_of_week: query.day_of_week,
  };

  const data = await repo.findAllBlocks(filters);
  const total = await repo.countBlocks(filters);
  return {
    data,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  };
};

exports.getBlockById = async (id, partnerId = null) => {
  const row = await repo.findBlockById(id);
  if (!row) throw new Error('NOT_FOUND');
  if (partnerId && String(row.partner_id) !== String(partnerId)) {
    throw new Error('FORBIDDEN');
  }
  const specialist_ids = await repo.listSpecialistIdsForBlock(id);
  return { ...row, specialist_ids };
};

exports.createBlock = async (body, partnerId = null, user = null) => {
  const specialist_ids = Array.isArray(body.specialist_ids)
    ? body.specialist_ids.map((x) => parseInt(x, 10)).filter((x) => !Number.isNaN(x))
    : [];
  const payload = buildBlockPayload(body, true);
  if (partnerId && String(payload.partner_id) !== String(partnerId)) {
    throw new Error('FORBIDDEN');
  }
  validateBlock(payload);
  await exports.assertPlaceBelongsToPartner(payload.clinic_place_id, payload.partner_id);
  await exports.assertPackagesBelongToClinic(
    payload.clinic_id,
    payload.default_price_package_id,
    payload.default_insurance_package_id
  );

  const block = await repo.createBlockWithSpecialists(payload, specialist_ids);
  
  if (user) {
    await repo.insertLog({
      schedule_block_id: block.id,
      action_type: 'CREATE',
      user_id: user.id,
      user_email: user.email,
      user_type: user.role_name ? 'admin' : 'partner',
      new_data: payload
    });
  }
  
  return exports.getBlockById(block.id);
};

exports.updateBlock = async (id, body, partnerId = null, user = null) => {
  const specialist_ids = Array.isArray(body.specialist_ids)
    ? body.specialist_ids.map((x) => parseInt(x, 10)).filter((x) => !Number.isNaN(x))
    : null;

  const existing = await repo.findBlockById(id);
  if (!existing) throw new Error('NOT_FOUND');
  if (partnerId && String(existing.partner_id) !== String(partnerId)) {
    throw new Error('FORBIDDEN');
  }

  const payload = buildBlockPayload(body, false);
  delete payload.created_at;
  if (partnerId && String(payload.partner_id) !== String(partnerId)) {
    throw new Error('FORBIDDEN');
  }
  validateBlock(payload);
  await exports.assertPlaceBelongsToPartner(payload.clinic_place_id, payload.partner_id);
  await exports.assertPackagesBelongToClinic(
    payload.clinic_id,
    payload.default_price_package_id,
    payload.default_insurance_package_id
  );

  await repo.updateBlock(id, payload);
  if (specialist_ids !== null) {
    await repo.replaceBlockSpecialists(id, specialist_ids);
  }
  
  if (user) {
    await repo.insertLog({
      schedule_block_id: id,
      action_type: existing.status !== payload.status ? 'TOGGLE_STATUS' : 'UPDATE',
      user_id: user.id,
      user_email: user.email,
      user_type: user.role_name ? 'admin' : 'partner',
      old_data: existing,
      new_data: payload
    });
  }

  return exports.getBlockById(id);
};

exports.deleteBlock = async (id, partnerId = null, user = null) => {
  const existing = await repo.findBlockById(id);
  if (!existing) throw new Error('NOT_FOUND');
  if (partnerId) {
    if (String(existing.partner_id) !== String(partnerId)) throw new Error('FORBIDDEN');
  }
  const row = await repo.deleteBlock(id);
  if (!row) throw new Error('NOT_FOUND');
  
  if (user) {
    await repo.insertLog({
      schedule_block_id: id,
      action_type: 'DELETE',
      user_id: user.id,
      user_email: user.email,
      user_type: user.role_name ? 'admin' : 'partner',
      old_data: existing
    });
  }
  
  return row;
};

exports.assertPlaceBelongsToPartner = async (placeId, partnerId) => {
  const r = await pool.query('SELECT partner_id FROM tbl_clinic_place WHERE id = $1', [placeId]);
  if (!r.rows[0]) throw new Error('Nơi khám không tồn tại');
  if (String(r.rows[0].partner_id) !== String(partnerId)) {
    throw new Error('Nơi khám không thuộc đối tác đã chọn');
  }
};

exports.assertPackagesBelongToClinic = async (clinicId, pricePkgId, insPkgId) => {
  if (pricePkgId) {
    const r = await pool.query('SELECT id FROM tbl_clinic_price_package WHERE id = $1 AND clinic_id = $2', [
      pricePkgId,
      clinicId,
    ]);
    if (!r.rows[0]) throw new Error('Gói giá không thuộc bác sĩ này');
  }
  if (insPkgId) {
    const r = await pool.query('SELECT id FROM tbl_clinic_insurance_package WHERE id = $1 AND clinic_id = $2', [
      insPkgId,
      clinicId,
    ]);
    if (!r.rows[0]) throw new Error('Gói bảo hiểm không thuộc bác sĩ này');
  }
};

exports.listPricePackages = async (clinicId) => {
  if (!clinicId) throw new Error('Thiếu clinic_id');
  return repo.listPricePackagesByClinic(clinicId);
};

exports.listInsurancePackages = async (clinicId) => {
  if (!clinicId) throw new Error('Thiếu clinic_id');
  return repo.listInsurancePackagesByClinic(clinicId);
};

exports.getOverrides = async (query) =>
  repo.findAllOverrides({
    clinic_id: query.clinic_id,
    clinic_place_id: query.clinic_place_id,
    limit: query.limit ? parseInt(query.limit, 10) : 100,
  });

exports.createOverride = async (body, partnerId = null) => {
  const payload = {
    clinic_id: parseIntOr(body.clinic_id, null),
    clinic_place_id:
      body.clinic_place_id === '' || body.clinic_place_id == null ? null : parseInt(body.clinic_place_id, 10),
    override_date: body.override_date,
    is_closed: !!body.is_closed,
    session_type: parseIntOr(body.session_type, null),
    note: nullIfEmpty(body.note),
    created_at: now(),
    updated_at: now(),
  };
  if (!payload.clinic_id) throw new Error('Thiếu clinic_id');
  if (!payload.override_date) throw new Error('Thiếu ngày override_date');
  if (partnerId) {
    // Assert the place/clinic belongs to partner
    if (payload.clinic_place_id) {
      await exports.assertPlaceBelongsToPartner(payload.clinic_place_id, partnerId);
    } else {
      const r = await pool.query('SELECT partner_ids FROM tbl_clinic WHERE id = $1', [payload.clinic_id]);
      if (!r.rows[0]) throw new Error('Bác sĩ không tồn tại');
      if (!r.rows[0].partner_ids || !r.rows[0].partner_ids.split(',').includes(String(partnerId))) {
        throw new Error('FORBIDDEN');
      }
    }
  }
  return repo.insertOverride(payload);
};

exports.deleteOverride = async (id, partnerId = null) => {
  if (partnerId) {
    const arr = await repo.findAllOverrides({}); // We should get override directly, but for now we'll do this
    const override = arr.find(x => x.id === parseInt(id, 10));
    if (!override) throw new Error('NOT_FOUND');
    // For override, we didn't add partner_id to the findAllOverrides row directly in service, let's fetch it simply
    const r = await pool.query(`
      SELECT o.id, pl.partner_id, c.partner_ids 
      FROM tbl_appt_schedule_day_override o
      LEFT JOIN tbl_clinic_place pl ON pl.id = o.clinic_place_id
      LEFT JOIN tbl_clinic c ON c.id = o.clinic_id
      WHERE o.id = $1
    `, [id]);
    const row = r.rows[0];
    if (!row) throw new Error('NOT_FOUND');
    const isPartner = (String(row.partner_id) === String(partnerId)) || 
                      (row.partner_ids && row.partner_ids.split(',').includes(String(partnerId)));
    if (!isPartner) throw new Error('FORBIDDEN');
  }
  const row = await repo.deleteOverride(id);
  if (!row) throw new Error('NOT_FOUND');
  return row;
};

exports.getLogs = async (query) => {
  const limit = parseIntOr(query.limit, 20);
  const offset = (parseIntOr(query.page, 1) - 1) * limit;
  return repo.findLogs({ ...query, limit, offset });
};
