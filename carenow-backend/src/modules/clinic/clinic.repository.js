const pool = require('../../config/database');

/** Đếm số lịch hẹn đang tham chiếu đến bác sĩ này */
exports.countAppointments = async (clinicId) => {
  const r = await pool.query(
    'SELECT COUNT(*) FROM tbl_appointment WHERE clinic_id = $1',
    [clinicId]
  );
  return parseInt(r.rows[0].count, 10);
};

exports.getAll = async (query = {}) => {
  let q = `
    SELECT c.*,
      (
        SELECT string_agg(s.name, ', ' ORDER BY s.name)
        FROM tbl_clinic_specialist s
        WHERE s.id::text = ANY(string_to_array(c.specialist_ids, ','))
      ) AS specialist_names
    FROM tbl_clinic c
    WHERE 1=1
  `;
  const values = [];
  let idx = 1;

  if (query.keyword) {
    q += ` AND (name ILIKE $${idx} OR address ILIKE $${idx} OR license ILIKE $${idx})`;
    values.push(`%${query.keyword}%`);
    idx++;
  }
  if (query.license) {
    q += ` AND license ILIKE $${idx}`;
    values.push(`%${query.license}%`);
    idx++;
  }
  if (query.status !== undefined && query.status !== '' && query.status !== null) {
    q += ` AND status = $${idx}`;
    values.push(query.status);
    idx++;
  }
  if (query.specialist_id) {
    q += ` AND $${idx} = ANY(STRING_TO_ARRAY(specialist_ids, ','))`;
    values.push(String(query.specialist_id));
    idx++;
  }

  if (query.show_in_root_place !== undefined && query.show_in_root_place !== '' && query.show_in_root_place !== null) {
    q += ` AND show_in_root_place = $${idx}`;
    values.push(query.show_in_root_place);
    idx++;
  }
  if (query.place_id) {
    q += ` AND $${idx} = ANY(STRING_TO_ARRAY(place_ids, ','))`;
    values.push(String(query.place_id));
    idx++;
  }
  if (query.service_id) {
    q += ` AND service = $${idx}`;
    values.push(query.service_id);
    idx++;
  }
  if (query.partner_id) {
    q += ` AND $${idx} = ANY(STRING_TO_ARRAY(partner_ids, ','))`;
    values.push(String(query.partner_id));
    idx++;
  }

  if (query.sort_context === 'place') {
    q += ' ORDER BY sponsor DESC NULLS LAST, show_in_root_place DESC NULLS LAST, rank ASC NULLS LAST, id ASC';
  } else if (query.sort_context === 'specialty') {
    q += ' ORDER BY sponsor DESC NULLS LAST, rank DESC NULLS LAST, id ASC';
  } else if (query.sort_context === 'service') {
    q += ' ORDER BY rank ASC NULLS LAST, id ASC';
  } else {
    q += ' ORDER BY sponsor DESC NULLS LAST, rank DESC NULLS LAST, created_at ASC NULLS LAST, id ASC';
  }

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
  let q = 'SELECT COUNT(*) FROM tbl_clinic WHERE 1=1';
  const values = [];
  let idx = 1;

  if (query.keyword) {
    q += ` AND (name ILIKE $${idx} OR address ILIKE $${idx} OR license ILIKE $${idx})`;
    values.push(`%${query.keyword}%`);
    idx++;
  }
  if (query.license) {
    q += ` AND license ILIKE $${idx}`;
    values.push(`%${query.license}%`);
    idx++;
  }
  if (query.status !== undefined && query.status !== '' && query.status !== null) {
    q += ` AND status = $${idx}`;
    values.push(query.status);
    idx++;
  }
  if (query.specialist_id) {
    q += ` AND $${idx} = ANY(STRING_TO_ARRAY(specialist_ids, ','))`;
    values.push(String(query.specialist_id));
    idx++;
  }
  if (query.show_in_root_place !== undefined && query.show_in_root_place !== '' && query.show_in_root_place !== null) {
    q += ` AND show_in_root_place = $${idx}`;
    values.push(query.show_in_root_place);
    idx++;
  }
  if (query.place_id) {
    q += ` AND $${idx} = ANY(STRING_TO_ARRAY(place_ids, ','))`;
    values.push(String(query.place_id));
    idx++;
  }
  if (query.service_id) {
    q += ` AND service = $${idx}`;
    values.push(query.service_id);
    idx++;
  }
  if (query.partner_id) {
    q += ` AND $${idx} = ANY(STRING_TO_ARRAY(partner_ids, ','))`;
    values.push(String(query.partner_id));
    idx++;
  }

  const result = await pool.query(q, values);
  return parseInt(result.rows[0].count, 10);
};

exports.create = async (data) => {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
  
  const query = `INSERT INTO tbl_clinic (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
};

exports.findById = async (id) => {
  const result = await pool.query('SELECT * FROM tbl_clinic WHERE id = $1', [id]);
  return result.rows[0];
};

exports.getPriceSummariesByClinicIds = async (clinicIds = [], placeId = null) => {
  const ids = clinicIds.map((id) => parseInt(id, 10)).filter((id) => !Number.isNaN(id));
  if (ids.length === 0) return new Map();

  const placeFilter = placeId == null || placeId === '' ? null : parseInt(placeId, 10);
  const result = await pool.query(
    `
    WITH active_price_items AS (
      SELECT
        pp.clinic_id,
        pp.id AS package_id,
        pp.name AS package_name,
        pp.description AS package_description,
        pp.rank AS package_rank,
        pi.id AS item_id,
        pi.label,
        pi.amount_vnd,
        pi.currency,
        pi.clinic_place_id,
        COALESCE(pl.display_name, pl.name) AS place_name
      FROM tbl_clinic_price_package pp
      JOIN tbl_clinic_price_item pi ON pi.price_package_id = pp.id
      LEFT JOIN tbl_clinic_place pl ON pl.id = pi.clinic_place_id
      WHERE pp.clinic_id = ANY($1::int[])
        AND pp.status = 1
        AND pi.status = 1
        AND CURRENT_DATE >= pi.effective_from
        AND (pi.effective_to IS NULL OR CURRENT_DATE <= pi.effective_to)
        AND ($2::int IS NULL OR pi.clinic_place_id IS NULL OR pi.clinic_place_id = $2::int)
    ),
    grouped_packages AS (
      SELECT
        clinic_id,
        package_id,
        package_name,
        package_description,
        package_rank,
        MIN(amount_vnd)::bigint AS package_min,
        MAX(amount_vnd)::bigint AS package_max,
        jsonb_agg(
          jsonb_build_object(
            'id', item_id,
            'label', label,
            'amount_vnd', amount_vnd,
            'currency', currency,
            'clinic_place_id', clinic_place_id,
            'place_name', place_name
          )
          ORDER BY amount_vnd ASC, item_id ASC
        ) AS items
      FROM active_price_items
      GROUP BY clinic_id, package_id, package_name, package_description, package_rank
    )
    SELECT
      clinic_id,
      MIN(package_min)::bigint AS min,
      MAX(package_max)::bigint AS max,
      COUNT(DISTINCT package_id)::int AS package_count,
      jsonb_agg(
        jsonb_build_object(
          'id', package_id,
          'name', package_name,
          'description', package_description,
          'min', package_min,
          'max', package_max,
          'items', items
        )
        ORDER BY package_rank ASC, package_id ASC
      ) AS packages
    FROM grouped_packages
    GROUP BY clinic_id
    `,
    [ids, Number.isNaN(placeFilter) ? null : placeFilter]
  );

  return new Map(result.rows.map((row) => [Number(row.clinic_id), row]));
};

exports.getInsuranceSummariesByClinicIds = async (clinicIds = [], placeId = null, partnerId = null) => {
  const ids = clinicIds.map((id) => parseInt(id, 10)).filter((id) => !Number.isNaN(id));
  if (ids.length === 0) return new Map();

  const placeFilter = placeId == null || placeId === '' ? null : parseInt(placeId, 10);
  const partnerFilter = partnerId == null || partnerId === '' ? null : parseInt(partnerId, 10);

  const result = await pool.query(
    `
    WITH active_insurance_items AS (
      SELECT
        ip.clinic_id,
        ip.id AS package_id,
        ip.name AS package_name,
        ip.partner_id,
        ip.rank AS package_rank,
        ii.id AS item_id,
        COALESCE(
          NULLIF(ii.insurance_type, ''),
          CASE
            WHEN LOWER(COALESCE(ii.insurer_name, '')) LIKE '%bhyt%'
              OR LOWER(COALESCE(ii.insurer_code, '')) = 'bhyt'
            THEN 'public'
            ELSE 'private'
          END
        ) AS insurance_type,
        ii.insurer_name,
        ii.insurer_code,
        ii.coverage_note,
        ii.copay_note,
        ii.requires_referral,
        ii.clinic_place_id,
        ii.rank AS item_rank,
        COALESCE(pl.display_name, pl.name) AS place_name
      FROM tbl_clinic_insurance_package ip
      JOIN tbl_clinic_insurance_item ii ON ii.insurance_package_id = ip.id
      LEFT JOIN tbl_clinic_place pl ON pl.id = ii.clinic_place_id
      WHERE ip.clinic_id = ANY($1::int[])
        AND ip.status = 1
        AND ii.status = 1
        AND ($2::int IS NULL OR ii.clinic_place_id IS NULL OR ii.clinic_place_id = $2::int)
        AND ($3::int IS NULL OR ip.partner_id IS NULL OR ip.partner_id = $3::int)
    )
    SELECT
      clinic_id,
      COUNT(DISTINCT package_id)::int AS package_count,
      BOOL_OR(insurance_type = 'public') AS has_public,
      BOOL_OR(insurance_type = 'private') AS has_private,
      jsonb_agg(
        jsonb_build_object(
          'id', item_id,
          'package_id', package_id,
          'package_name', package_name,
          'partner_id', partner_id,
          'insurance_type', insurance_type,
          'insurer_name', insurer_name,
          'insurer_code', insurer_code,
          'coverage_note', coverage_note,
          'copay_note', copay_note,
          'requires_referral', requires_referral,
          'clinic_place_id', clinic_place_id,
          'place_name', place_name
        )
        ORDER BY package_rank ASC, item_rank ASC, item_id ASC
      ) AS items
    FROM active_insurance_items
    GROUP BY clinic_id
    `,
    [
      ids,
      Number.isNaN(placeFilter) ? null : placeFilter,
      Number.isNaN(partnerFilter) ? null : partnerFilter,
    ]
  );

  return new Map(result.rows.map((row) => [Number(row.clinic_id), row]));
};

exports.update = async (id, data) => {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const assignments = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
  
  const query = `UPDATE tbl_clinic SET ${assignments} WHERE id = $${fields.length + 1} RETURNING *`;
  values.push(id);
  const result = await pool.query(query, values);
  return result.rows[0];
};

exports.delete = async (id) => {
  const query = `DELETE FROM tbl_clinic WHERE id = $1 RETURNING id`;
  const result = await pool.query(query, [id]);
  return result.rowCount > 0;
};
