#!/usr/bin/env node
/**
 * Sinh lịch mẫu (tbl_appt_schedule_block + gói giá/BH) từ dữ liệu đã import:
 *   tbl_clinic + tbl_clinic_place + tbl_partner
 *
 * Luồng:
 *   1) Với mỗi clinic (status=1): suy ra danh sách (clinic_place_id, partner_id)
 *      — ưu tiên parse clinic.place_ids khớp bảng place; nếu rỗng thì gắn 1 place đầu tiên
 *        theo từng id trong clinic.partner_ids.
 *   2) Đảm bảo mỗi clinic có 1 gói giá + 1 gói BH (partner = partner của place),
 *      1 dòng giá + 1 dòng BH gắn đúng place.
 *   3) Chèn block: T2–T7 (1–6), buổi sáng + chiều (nếu chưa tồn tại cùng khóa tự nhiên).
 *   4) Gắn chuyên khoa: metadata.primarySpecialtyIds nếu id tồn tại trong tbl_clinic_specialist;
 *      không thì không gắn (để admin chọn sau).
 *
 * Chạy từ carenow-backend:
 *   node scripts/seed_schedule_from_clinic_graph.js
 *
 * Biến môi trường:
 *   DRY_RUN=1     — chỉ log, không INSERT
 *   LIMIT_CLINICS=N — chỉ xử lý N bác sĩ đầu (theo id ASC) để thử
 *
 * Idempotent: không trùng block (clinic_id, clinic_place_id, day_of_week, session_type, start_time).
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const now = () => Math.floor(Date.now() / 1000);
const todaySql = () => new Date().toISOString().slice(0, 10);

const PKG_PRICE_NAME = 'Gói khám mặc định (seed schedule)';
const PKG_INS_NAME = 'Gói thanh toán mặc định (seed schedule)';

function parseIdList(s) {
  if (s == null || String(s).trim() === '') return [];
  const t = String(s).trim();
  if (t.startsWith('[')) {
    try {
      const arr = JSON.parse(t);
      if (Array.isArray(arr)) {
        return arr
          .map((x) => parseInt(String(x).replace(/"/g, ''), 10))
          .filter((n) => !Number.isNaN(n) && n > 0);
      }
    } catch {
      /* tiếp tục split thường */
    }
  }
  return t
    .split(/[,;|\s]+/)
    .map((x) => parseInt(x.replace(/^\[|\]$/g, '').replace(/"/g, '').trim(), 10))
    .filter((n) => !Number.isNaN(n) && n > 0);
}

function dedupePairs(pairs) {
  const seen = new Set();
  const out = [];
  for (const p of pairs) {
    const k = `${p.placeId}:${p.partnerId}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }
  return out;
}

async function resolvePlacePartnerPairs(client, clinic) {
  const pairs = [];
  for (const pid of parseIdList(clinic.place_ids)) {
    const r = await client.query(
      `SELECT id, partner_id FROM tbl_clinic_place
       WHERE id = $1 AND status = 1 AND partner_id IS NOT NULL AND partner_id > 0`,
      [pid]
    );
    if (r.rows[0]) pairs.push({ placeId: r.rows[0].id, partnerId: r.rows[0].partner_id });
  }
  if (pairs.length === 0) {
    for (const prid of parseIdList(clinic.partner_ids)) {
      if (!(prid > 0)) continue;
      const r = await client.query(
        `SELECT id, partner_id FROM tbl_clinic_place
         WHERE partner_id = $1 AND status = 1 AND partner_id IS NOT NULL AND partner_id > 0
         ORDER BY id ASC LIMIT 3`,
        [prid]
      );
      for (const row of r.rows) pairs.push({ placeId: row.id, partnerId: row.partner_id });
    }
  }
  return dedupePairs(pairs);
}

async function ensurePricePackage(client, clinicId, placeId, priceMinCsv) {
  const t = now();
  const r0 = await client.query(
    `SELECT id FROM tbl_clinic_price_package WHERE clinic_id = $1 AND name = $2 LIMIT 1`,
    [clinicId, PKG_PRICE_NAME]
  );
  let pkgId = r0.rows[0]?.id;
  if (!pkgId) {
    const ins = await client.query(
      `INSERT INTO tbl_clinic_price_package (clinic_id, name, description, status, rank, created_at, updated_at)
       VALUES ($1, $2, $3, 1, 1, $4, $4) RETURNING id`,
      [clinicId, PKG_PRICE_NAME, 'Tự tạo khi seed lịch', t]
    );
    pkgId = ins.rows[0].id;
  }
  const amount = Math.max(0, parseInt(priceMinCsv, 10) || 300000);
  const rItem = await client.query(
    `SELECT id FROM tbl_clinic_price_item
     WHERE price_package_id = $1 AND clinic_place_id IS NOT DISTINCT FROM $2
       AND effective_from = $3::date AND session_type IS NULL AND day_of_week IS NULL
     LIMIT 1`,
    [pkgId, placeId, todaySql()]
  );
  if (!rItem.rows[0]) {
    await client.query(
      `INSERT INTO tbl_clinic_price_item (
        price_package_id, clinic_place_id, effective_from, effective_to,
        day_of_week, session_type, amount_vnd, label, status, rank, created_at, updated_at
      ) VALUES ($1, $2, $3::date, NULL, NULL, NULL, $4, 'Giá seed', 1, 1, $5, $5)`,
      [pkgId, placeId, todaySql(), amount, t]
    );
  }
  return pkgId;
}

async function ensureInsurancePackage(client, clinicId, partnerId, placeId) {
  const t = now();
  const pid = partnerId && partnerId > 0 ? partnerId : null;
  const r0 = await client.query(
    `SELECT id FROM tbl_clinic_insurance_package
     WHERE clinic_id = $1 AND name = $2 AND (partner_id IS NOT DISTINCT FROM $3)
     LIMIT 1`,
    [clinicId, PKG_INS_NAME, pid]
  );
  let pkgId = r0.rows[0]?.id;
  if (!pkgId) {
    const ins = await client.query(
      `INSERT INTO tbl_clinic_insurance_package (clinic_id, partner_id, name, description, status, rank, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 1, 1, $5, $5) RETURNING id`,
      [clinicId, pid, PKG_INS_NAME, 'Tự tạo khi seed lịch', t]
    );
    pkgId = ins.rows[0].id;
  }
  const rItem = await client.query(
    `SELECT id FROM tbl_clinic_insurance_item
     WHERE insurance_package_id = $1 AND (clinic_place_id IS NOT DISTINCT FROM $2) AND insurer_name = 'BHYT / TN'
     LIMIT 1`,
    [pkgId, placeId]
  );
  if (!rItem.rows[0]) {
    await client.query(
      `INSERT INTO tbl_clinic_insurance_item (
        insurance_package_id, clinic_place_id, insurer_name, coverage_note, status, rank, created_at, updated_at
      ) VALUES ($1, $2, 'BHYT / TN', 'Theo chính sách cơ sở — chỉnh sau', 1, 1, $3, $3)`,
      [pkgId, placeId, t]
    );
  }
  return pkgId;
}

async function pickSpecialistIds(client, clinic) {
  const ids = [];
  try {
    const m = JSON.parse(clinic.metadata || '{}');
    const arr = m.primarySpecialtyIds;
    if (Array.isArray(arr)) {
      for (const raw of arr) {
        const id = parseInt(raw, 10);
        if (Number.isNaN(id)) continue;
        const r = await client.query('SELECT id FROM tbl_clinic_specialist WHERE id = $1 AND status = 1', [id]);
        if (r.rows[0]) ids.push(id);
      }
    }
  } catch {
    /* ignore */
  }
  return [...new Set(ids)];
}

const SESSIONS = [
  { session_type: 1, start_time: '07:30', end_time: '11:30' },
  { session_type: 2, start_time: '13:30', end_time: '17:00' },
];

async function blockExists(client, clinicId, placeId, dow, sessionType, startTime) {
  const r = await client.query(
    `SELECT 1 FROM tbl_appt_schedule_block
     WHERE clinic_id = $1 AND clinic_place_id = $2 AND day_of_week = $3
       AND session_type = $4 AND start_time = $5::time
     LIMIT 1`,
    [clinicId, placeId, dow, sessionType, startTime]
  );
  return !!r.rows[0];
}

async function insertBlock(client, payload, specialistIds) {
  const fields = Object.keys(payload);
  const values = Object.values(payload);
  const ph = fields.map((_, i) => `$${i + 1}`).join(', ');
  const ins = await client.query(
    `INSERT INTO tbl_appt_schedule_block (${fields.join(', ')}) VALUES (${ph}) RETURNING id`,
    values
  );
  const blockId = ins.rows[0].id;
  for (const sid of specialistIds) {
    await client.query(
      `INSERT INTO tbl_appt_schedule_block_specialist (schedule_block_id, specialist_id) VALUES ($1, $2)
       ON CONFLICT (schedule_block_id, specialist_id) DO NOTHING`,
      [blockId, sid]
    );
  }
  return blockId;
}

async function main() {
  const dry = process.env.DRY_RUN === '1';
  const limitClinics = process.env.LIMIT_CLINICS ? parseInt(process.env.LIMIT_CLINICS, 10) : null;

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  let qClinics = `SELECT id, place_ids, partner_ids, price_min, metadata, status FROM tbl_clinic WHERE status = 1 ORDER BY id ASC`;
  const params = [];
  if (limitClinics && !Number.isNaN(limitClinics)) {
    qClinics += ` LIMIT $1`;
    params.push(limitClinics);
  }

  const { rows: clinics } = await pool.query(qClinics, params);
  console.log('Clinic status=1:', clinics.length, dry ? '(DRY_RUN)' : '');

  let blocksInserted = 0;
  let pairsSkipped = 0;

  const client = await pool.connect();
  try {
    if (!dry) await client.query('BEGIN');

    for (const clinic of clinics) {
      const pairs = await resolvePlacePartnerPairs(client, clinic);
      if (pairs.length === 0) {
        pairsSkipped += 1;
        continue;
      }
      const specialistIds = dry ? [] : await pickSpecialistIds(client, clinic);

      for (const { placeId, partnerId } of pairs) {
        if (!partnerId || partnerId <= 0) continue;
        const okp = await client.query('SELECT 1 FROM tbl_partner WHERE id = $1', [partnerId]);
        if (!okp.rows[0]) continue;

        const pricePkgId = dry ? null : await ensurePricePackage(client, clinic.id, placeId, clinic.price_min);
        const insPkgId = dry ? null : await ensureInsurancePackage(client, clinic.id, partnerId, placeId);
        const t = now();

        for (let dow = 1; dow <= 6; dow += 1) {
          for (const se of SESSIONS) {
            if (dry) {
              blocksInserted += 1;
              continue;
            }
            const exists = await blockExists(client, clinic.id, placeId, dow, se.session_type, se.start_time);
            if (exists) continue;

            const payload = {
              clinic_id: clinic.id,
              partner_id: partnerId,
              clinic_place_id: placeId,
              day_of_week: dow,
              session_type: se.session_type,
              start_time: se.start_time,
              end_time: se.end_time,
              slot_step_minutes: 30,
              appointment_duration_minutes: 30,
              cutoff_minutes_before_slot: 30,
              valid_from: null,
              valid_to: null,
              default_price_package_id: pricePkgId,
              default_insurance_package_id: insPkgId,
              status: 1,
              rank: 10,
              created_at: t,
              updated_at: t,
            };
            await insertBlock(client, payload, specialistIds);
            blocksInserted += 1;
          }
        }
      }
    }

    if (!dry) await client.query('COMMIT');
  } catch (e) {
    if (!dry) await client.query('ROLLBACK');
    console.error(e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }

  console.log('Xong. Clinic bỏ qua (không gắn được place+partner):', pairsSkipped);
  console.log(dry ? 'DRY_RUN — blocks (ước lượng):' : 'Blocks chèn mới:', blocksInserted);
}

main();
