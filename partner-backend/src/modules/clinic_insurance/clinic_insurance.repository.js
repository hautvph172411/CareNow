const pool = require('../../config/database');

const now = () => Math.floor(Date.now() / 1000);

exports.findPackages = async (query = {}) => {
  let q = `
    SELECT ip.*, c.name AS clinic_name, p.name AS partner_name
    FROM tbl_clinic_insurance_package ip
    LEFT JOIN tbl_clinic c ON c.id = ip.clinic_id
    LEFT JOIN tbl_partner p ON p.id = ip.partner_id
    WHERE 1=1
  `;
  const vals = [];
  let i = 1;
  if (query.clinic_id) {
    q += ` AND ip.clinic_id = $${i++}`;
    vals.push(query.clinic_id);
  }
  if (query.keyword) {
    q += ` AND (ip.name ILIKE $${i} OR ip.description ILIKE $${i})`;
    vals.push(`%${query.keyword}%`);
    i++;
  }
  if (query.status !== undefined && query.status !== '') {
    q += ` AND ip.status = $${i++}`;
    vals.push(query.status);
  }
  q += ' ORDER BY ip.rank ASC, ip.id DESC';
  if (query.limit) {
    q += ` LIMIT $${i++}`;
    vals.push(query.limit);
  }
  if (query.offset !== undefined) {
    q += ` OFFSET $${i++}`;
    vals.push(query.offset);
  }
  return (await pool.query(q, vals)).rows;
};

exports.countPackages = async (query = {}) => {
  let q = 'SELECT COUNT(*) FROM tbl_clinic_insurance_package ip WHERE 1=1';
  const vals = [];
  let i = 1;
  if (query.clinic_id) {
    q += ` AND ip.clinic_id = $${i++}`;
    vals.push(query.clinic_id);
  }
  if (query.keyword) {
    q += ` AND (ip.name ILIKE $${i} OR ip.description ILIKE $${i})`;
    vals.push(`%${query.keyword}%`);
    i++;
  }
  if (query.status !== undefined && query.status !== '') {
    q += ` AND ip.status = $${i++}`;
    vals.push(query.status);
  }
  return parseInt((await pool.query(q, vals)).rows[0].count, 10);
};

exports.findPackageById = async (id) => {
  const r = await pool.query(
    `SELECT ip.*, c.name AS clinic_name, p.name AS partner_name
     FROM tbl_clinic_insurance_package ip
     LEFT JOIN tbl_clinic c ON c.id = ip.clinic_id
     LEFT JOIN tbl_partner p ON p.id = ip.partner_id
     WHERE ip.id = $1`,
    [id]
  );
  return r.rows[0];
};

exports.findItemsByPackageId = async (packageId) => {
  const r = await pool.query(
    `SELECT it.*, pl.name AS place_name
     FROM tbl_clinic_insurance_item it
     LEFT JOIN tbl_clinic_place pl ON pl.id = it.clinic_place_id
     WHERE it.insurance_package_id = $1
     ORDER BY it.rank ASC, it.id`,
    [packageId]
  );
  return r.rows;
};

exports.updatePackage = async (id, payload) => {
  const keys = Object.keys(payload);
  const vals = Object.values(payload);
  if (keys.length === 0) return null;
  const set = keys.map((k, j) => `${k} = $${j + 1}`).join(', ');
  vals.push(id);
  const r = await pool.query(
    `UPDATE tbl_clinic_insurance_package SET ${set} WHERE id = $${vals.length} RETURNING *`,
    vals
  );
  return r.rows[0];
};

exports.deletePackage = async (id) => {
  const r = await pool.query('DELETE FROM tbl_clinic_insurance_package WHERE id = $1 RETURNING id', [id]);
  return r.rows[0];
};

exports.replaceItems = async (packageId, items) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM tbl_clinic_insurance_item WHERE insurance_package_id = $1', [packageId]);
    const t = now();
    for (const row of items) {
      const payload = { ...row, insurance_package_id: packageId, created_at: t, updated_at: t };
      const keys = Object.keys(payload);
      const vals = Object.values(payload);
      const ph = keys.map((_, j) => `$${j + 1}`).join(', ');
      await client.query(
        `INSERT INTO tbl_clinic_insurance_item (${keys.join(', ')}) VALUES (${ph})`,
        vals
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

exports.createPackageWithItems = async (pkgPayload, itemsPayload) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const keys = Object.keys(pkgPayload);
    const vals = Object.values(pkgPayload);
    const ph = keys.map((_, j) => `$${j + 1}`).join(', ');
    const ins = await client.query(
      `INSERT INTO tbl_clinic_insurance_package (${keys.join(', ')}) VALUES (${ph}) RETURNING *`,
      vals
    );
    const pkg = ins.rows[0];
    const t = now();
    for (const row of itemsPayload) {
      const payload = { ...row, insurance_package_id: pkg.id, created_at: t, updated_at: t };
      const k2 = Object.keys(payload);
      const v2 = Object.values(payload);
      const p2 = k2.map((_, j) => `$${j + 1}`).join(', ');
      await client.query(
        `INSERT INTO tbl_clinic_insurance_item (${k2.join(', ')}) VALUES (${p2})`,
        v2
      );
    }
    await client.query('COMMIT');
    return pkg;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

module.exports = exports;
