const pool = require('../../config/database');

/** Cột đúng theo schema cốt lõi tbl_clinic_place */
const SELECT_LIST = `id, name, short_name, display_name, province_id, district_id, address, info,
  status, partner_id, parent_id, page_content_blocks, show_children, created_at, updated_at, admin_note,
  has_insurance, patient_guide, address_guide, images, phone, title, description, url,
  description_detail, logo, page_type, rank, "order", custom_button_text, custom_button_link,
  metadata, self_supported`;

exports.getAll = async (query = {}) => {
  let q = `SELECT ${SELECT_LIST} FROM tbl_clinic_place WHERE 1=1`;
  const values = [];
  let idx = 1;

  if (query.keyword) {
    q += ` AND (name ILIKE $${idx} OR address ILIKE $${idx} OR short_name ILIKE $${idx})`;
    values.push(`%${query.keyword}%`);
    idx++;
  }
  if (query.status !== undefined) {
    q += ` AND status = $${idx}`;
    values.push(query.status);
    idx++;
  }
  if (query.province_id) {
    q += ` AND province_id = $${idx}`;
    values.push(query.province_id);
    idx++;
  }
  if (query.partner_id !== undefined && query.partner_id !== '') {
    q += ` AND partner_id = $${idx}`;
    values.push(query.partner_id);
    idx++;
  }

  q += ' ORDER BY rank DESC NULLS LAST, created_at ASC NULLS LAST, "order" ASC NULLS LAST, id ASC';

  if (query.limit) {
    q += ` LIMIT $${idx}`;
    values.push(query.limit);
    idx++;
  }
  if (query.offset !== undefined) {
    q += ` OFFSET $${idx}`;
    values.push(query.offset);
    idx++;
  }

  const result = await pool.query(q, values);
  return result.rows;
};

exports.count = async (query = {}) => {
  let q = 'SELECT COUNT(*) FROM tbl_clinic_place WHERE 1=1';
  const values = [];
  let idx = 1;

  if (query.keyword) {
    q += ` AND (name ILIKE $${idx} OR address ILIKE $${idx} OR short_name ILIKE $${idx})`;
    values.push(`%${query.keyword}%`);
    idx++;
  }
  if (query.status !== undefined) {
    q += ` AND status = $${idx}`;
    values.push(query.status);
    idx++;
  }
  if (query.province_id) {
    q += ` AND province_id = $${idx}`;
    values.push(query.province_id);
    idx++;
  }
  if (query.partner_id !== undefined && query.partner_id !== '') {
    q += ` AND partner_id = $${idx}`;
    values.push(query.partner_id);
    idx++;
  }

  const result = await pool.query(q, values);
  return parseInt(result.rows[0].count, 10);
};

exports.findById = async (id) => {
  const result = await pool.query(`SELECT ${SELECT_LIST} FROM tbl_clinic_place WHERE id = $1`, [id]);
  return result.rows[0];
};

exports.create = async (data) => {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const quotedFields = fields.map((f) => (f === 'order' || f === 'rank' ? `"${f}"` : f));
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

  const query = `INSERT INTO tbl_clinic_place (${quotedFields.join(', ')}) VALUES (${placeholders}) RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
};

exports.update = async (id, data) => {
  const fields = Object.keys(data);
  const values = Object.values(data);
  if (fields.length === 0) return null;

  const assignments = fields.map((field, i) => {
    const fieldName = field === 'order' || field === 'rank' ? `"${field}"` : field;
    return `${fieldName} = $${i + 1}`;
  }).join(', ');

  values.push(id);

  const query = `UPDATE tbl_clinic_place SET ${assignments} WHERE id = $${fields.length + 1} RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
};

exports.remove = async (id) => {
  const result = await pool.query('DELETE FROM tbl_clinic_place WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};

/** Tất cả nơi khám cùng đối tác (lọc cha bằng JS + metadata.place_kind / suy luận cây) */
exports.findPartnerPlacesForParentPick = async ({ partnerId, excludeId }) => {
  if (!partnerId) return [];
  const values = [partnerId];
  let q = `SELECT id, name, short_name, display_name, parent_id, metadata
    FROM tbl_clinic_place
    WHERE partner_id = $1 AND status = 1`;
  let idx = 2;
  if (excludeId) {
    q += ` AND id <> $${idx}`;
    values.push(excludeId);
    idx++;
  }
  q += ' ORDER BY name ASC NULLS LAST, id ASC';
  const result = await pool.query(q, values);
  return result.rows;
};
