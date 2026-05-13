#!/usr/bin/env node
/**
 * Import tbl_clinic_place (export BookingCare) → CareNow tbl_clinic_place.
 *
 * Mapping:
 * - Cột CSV → các cột cốt lõi trong clinic_place.repository SELECT_LIST.
 * - has_insurrance → has_insurance; desc → description_detail
 * - address_display, address_short, longitude, latitude, email, bc_id, sync_status,
 *   name_sub, address_exam, commission, approvers, fulltext_search_data
 *   gộp vào metadata (JSON text), bảo toàn JSON có sẵn trong CSV nếu parse được.
 * - page_content_blocks: luôn [] (CareNow quản lý riêng; không parse PHP serialize trong info).
 *
 * Chạy từ thư mục carenow-backend:
 *   node scripts/import_clinic_place_from_csv.js [đường_dẫn_csv]
 *
 * Biến môi trường:
 *   DRY_RUN=1  — chỉ in số dòng, không ghi DB
 *
 * Yêu cầu: đã chạy seed partner (FK partner_id).
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const { parseCsv, stripBom } = require('./csv_rfc4180');

const DEFAULT_CSV = path.join(__dirname, '..', '..', 'tbl_clinic_place.csv');

function toIntOrNull(v) {
  if (v == null) return null;
  const t = String(v).trim();
  if (t === '') return null;
  const n = parseInt(t, 10);
  return Number.isNaN(n) ? null : n;
}

function toBool(v) {
  if (v == null || String(v).trim() === '') return false;
  const t = String(v).trim().toLowerCase();
  if (t === '1' || t === 'true' || t === 't' || t === 'yes') return true;
  return false;
}

function normalizeStatus(v) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return 0;
  if (n === 1) return 1;
  return 0;
}

function mergeMetadata(row, headerIndex) {
  const g = (name) => row[headerIndex[name]] ?? '';
  let base = {};
  const rawMeta = g('metadata').trim();
  if (rawMeta) {
    try {
      const p = JSON.parse(rawMeta);
      if (p && typeof p === 'object' && !Array.isArray(p)) base = { ...p };
    } catch {
      /* giữ base rỗng */
    }
  }
  const lon = g('longitude').trim();
  const lat = g('latitude').trim();
  const extra = {
    import_source: 'tbl_clinic_place.csv',
  };
  const ad = g('address_display').trim();
  if (ad) extra.address_display = ad;
  const ash = g('address_short').trim();
  if (ash) extra.address_short = ash;
  const em = g('email').trim();
  if (em) extra.legacy_email = em;
  const bc = g('bc_id').trim();
  if (bc) extra.bc_id = bc;
  const ss = g('sync_status').trim();
  if (ss !== '') extra.sync_status = ss;
  const ns = g('name_sub').trim();
  if (ns) extra.name_sub = ns;
  const ae = g('address_exam').trim();
  if (ae) extra.address_exam = ae;
  const cm = g('commission').trim();
  if (cm !== '') extra.commission = cm;
  const ap = g('approvers').trim();
  if (ap) extra.approvers = ap;
  const fts = g('fulltext_search_data').trim();
  if (fts && fts.length < 2000) extra.fulltext_search_data = fts;
  if (lon !== '' && !Number.isNaN(parseFloat(lon))) extra.longitude = parseFloat(lon);
  if (lat !== '' && !Number.isNaN(parseFloat(lat))) extra.latitude = parseFloat(lat);
  return JSON.stringify({ ...base, ...extra });
}

function rowToRecord(row, headerIndex, idSet) {
  const g = (name) => row[headerIndex[name]] ?? '';
  const id = parseInt(g('id'), 10);
  if (Number.isNaN(id)) return null;

  let parentId = toIntOrNull(g('parent_id'));
  if (parentId != null && !idSet.has(parentId)) parentId = null;

  let partnerId = toIntOrNull(g('partner_id'));

  const rec = {
    id,
    name: g('name').trim() || `Place #${id}`,
    short_name: g('short_name').trim() || null,
    display_name: g('display_name').trim() || null,
    province_id: toIntOrNull(g('province_id')),
    district_id: toIntOrNull(g('district_id')),
    address: g('address').trim() || null,
    info: g('info') || null,
    status: normalizeStatus(g('status')),
    partner_id: partnerId,
    parent_id: parentId,
    page_content_blocks: [],
    show_children: toBool(g('show_children')),
    created_at: toIntOrNull(g('created_at')),
    updated_at: toIntOrNull(g('updated_at')),
    admin_note: g('admin_note').trim() || null,
    has_insurance: toBool(g('has_insurrance')),
    patient_guide: g('patient_guide').trim() || null,
    address_guide: g('address_guide').trim() || null,
    images: g('images').trim() || null,
    phone: g('phone').trim() || null,
    title: g('title').trim() || null,
    description: g('description').trim() || null,
    url: g('url').trim() || null,
    description_detail: g('desc').trim() || null,
    logo: g('logo').trim() || null,
    page_type: toIntOrNull(g('page_type')) ?? 0,
    rank: toIntOrNull(g('rank')),
    order: toIntOrNull(g('order')) ?? 99,
    custom_button_text: g('custom_button_text').trim() || null,
    custom_button_link: g('custom_button_link').trim() || null,
    metadata: mergeMetadata(row, headerIndex),
    self_supported: toIntOrNull(g('self_supported')) ?? 0,
  };
  return rec;
}

const UPSERT_SQL = `
INSERT INTO tbl_clinic_place (
  id, name, short_name, display_name, province_id, district_id, address, info,
  status, partner_id, parent_id, page_content_blocks, show_children, created_at, updated_at, admin_note,
  has_insurance, patient_guide, address_guide, images, phone, title, description, url,
  description_detail, logo, page_type, rank, "order", custom_button_text, custom_button_link,
  metadata, self_supported
) VALUES (
  $1,$2,$3,$4,$5,$6,$7,$8,
  $9,$10,$11,$12::jsonb,$13,$14,$15,$16,
  $17,$18,$19,$20,$21,$22,$23,$24,
  $25,$26,$27,$28,$29,$30,$31,
  $32,$33
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  display_name = EXCLUDED.display_name,
  province_id = EXCLUDED.province_id,
  district_id = EXCLUDED.district_id,
  address = EXCLUDED.address,
  info = EXCLUDED.info,
  status = EXCLUDED.status,
  partner_id = EXCLUDED.partner_id,
  parent_id = EXCLUDED.parent_id,
  page_content_blocks = EXCLUDED.page_content_blocks,
  show_children = EXCLUDED.show_children,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at,
  admin_note = EXCLUDED.admin_note,
  has_insurance = EXCLUDED.has_insurance,
  patient_guide = EXCLUDED.patient_guide,
  address_guide = EXCLUDED.address_guide,
  images = EXCLUDED.images,
  phone = EXCLUDED.phone,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  url = EXCLUDED.url,
  description_detail = EXCLUDED.description_detail,
  logo = EXCLUDED.logo,
  page_type = EXCLUDED.page_type,
  rank = EXCLUDED.rank,
  "order" = EXCLUDED."order",
  custom_button_text = EXCLUDED.custom_button_text,
  custom_button_link = EXCLUDED.custom_button_link,
  metadata = EXCLUDED.metadata,
  self_supported = EXCLUDED.self_supported
`;

/** Đảm bảo cha insert trước con nếu sau này bật FK parent_id → tbl_clinic_place. */
function sortByParentBeforeChild(records) {
  const byId = Object.fromEntries(records.map((r) => [r.id, r]));
  const memo = new Map();
  const depth = (id, stack = new Set()) => {
    if (memo.has(id)) return memo.get(id);
    if (stack.has(id)) {
      memo.set(id, 0);
      return 0;
    }
    stack.add(id);
    const row = byId[id];
    let d = 0;
    if (row && row.parent_id != null && byId[row.parent_id]) {
      d = 1 + depth(row.parent_id, stack);
    }
    stack.delete(id);
    memo.set(id, d);
    return d;
  };
  return [...records].sort((a, b) => depth(a.id) - depth(b.id) || a.id - b.id);
}

function valuesFromRecord(r) {
  return [
    r.id,
    r.name,
    r.short_name,
    r.display_name,
    r.province_id,
    r.district_id,
    r.address,
    r.info,
    r.status,
    r.partner_id,
    r.parent_id,
    JSON.stringify(r.page_content_blocks),
    r.show_children,
    r.created_at,
    r.updated_at,
    r.admin_note,
    r.has_insurance,
    r.patient_guide,
    r.address_guide,
    r.images,
    r.phone,
    r.title,
    r.description,
    r.url,
    r.description_detail,
    r.logo,
    r.page_type,
    r.rank,
    r.order,
    r.custom_button_text,
    r.custom_button_link,
    r.metadata,
    r.self_supported,
  ];
}

async function main() {
  const csvPath = process.argv[2] || DEFAULT_CSV;
  const dry = process.env.DRY_RUN === '1';

  if (!fs.existsSync(csvPath)) {
    console.error('Không thấy file:', csvPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(csvPath, 'utf8');
  const table = parseCsv(raw);
  if (table.length < 2) {
    console.error('CSV không đủ dòng.');
    process.exit(1);
  }

  const headers = table[0].map((h) => stripBom(h.trim()));
  const headerIndex = Object.fromEntries(headers.map((h, i) => [h, i]));
  const required = ['id', 'name', 'has_insurrance', 'desc'];
  for (const k of required) {
    if (headerIndex[k] === undefined) {
      console.error('Thiếu cột CSV:', k);
      process.exit(1);
    }
  }

  const dataRows = table.slice(1);
  const idSet = new Set();
  for (const row of dataRows) {
    const id = parseInt(row[headerIndex.id], 10);
    if (!Number.isNaN(id)) idSet.add(id);
  }

  const records = [];
  for (const row of dataRows) {
    const rec = rowToRecord(row, headerIndex, idSet);
    if (rec) records.push(rec);
  }

  console.log('Đọc được', records.length, 'bản ghi từ', csvPath);

  if (dry) {
    console.log('DRY_RUN=1 — không ghi database.');
    process.exit(0);
  }

  const sorted = sortByParentBeforeChild(records);

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const r of sorted) {
      await client.query(UPSERT_SQL, valuesFromRecord(r));
    }
    await client.query(
      `SELECT setval(
        pg_get_serial_sequence('tbl_clinic_place', 'id'),
        COALESCE((SELECT MAX(id) FROM tbl_clinic_place), 1)
      )`
    );
    await client.query('COMMIT');
    console.log('Đã UPSERT', records.length, 'dòng vào tbl_clinic_place.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
