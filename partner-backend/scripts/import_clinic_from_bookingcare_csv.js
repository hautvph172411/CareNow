#!/usr/bin/env node
/**
 * Export BookingCare (bác sĩ / clinic) CSV → CareNow tbl_clinic + tách file phụ.
 *
 * Tách (khi SPLIT_OUTPUT=1):
 *   scripts/generated/clinic_bookingcare_core.csv   — cột khớp tbl_clinic (sau map)
 *   scripts/generated/clinic_bookingcare_source.jsonl — toàn bộ cột gốc từng id (non-empty), để đối chiếu
 *
 * Import DB:
 *   - Cột trùng tên với tbl_clinic: map trực tiếp (kiểu số/bool chuẩn hoá).
 *   - specialist_ids (BC) → lưu trong metadata.bookingcare.specialist_ids; cột specialist_ids để '' (id CK CareNow khác BC).
 *   - parent_id, email, price_max, patient_guide, ... → metadata.bookingcare + merge JSON cột metadata gốc.
 *   - keyword gộp vào search_text.
 *
 * Chạy từ carenow-backend:
 *   node scripts/import_clinic_from_bookingcare_csv.js [đường_dẫn_csv]
 *
 *   DRY_RUN=1        — không ghi DB
 *   SPLIT_OUTPUT=1   — ghi file tách vào scripts/generated/
 *
 * Mặc định CSV: ../../sql (5).csv (cùng cấp carenow-backend)
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const { parseCsv, stripBom } = require('./csv_rfc4180');

const DEFAULT_CSV = path.join(__dirname, '..', '..', 'sql (5).csv');
const GENERATED_DIR = path.join(__dirname, 'generated');

/** Cột tbl_clinic (public) — khớp information_schema đã kiểm tra */
const DB_COLUMNS = [
  'id',
  'name',
  'url',
  'picture',
  'address',
  'summary',
  'content',
  'title',
  'created_at',
  'updated_at',
  'status',
  'rank',
  'price_min',
  'is_work',
  'service',
  'metadata',
  'show_feedback',
  'sponsor',
  'specialist_ids',
  'province_id',
  'district_ids',
  'place_ids',
  'partner_ids',
  'appointment_total',
  'sync_status',
  'license',
  'payment_method',
  'payment_scope',
  'self_supported',
  'show_in_root_place',
  'show_phone',
  'forward_place',
  'rebook_nextday_suggest',
  'search_text',
  'approvers',
];

function csvEscapeCell(val) {
  if (val == null) return '';
  const s = String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toIntOrNull(v) {
  if (v == null) return null;
  const t = String(v).trim();
  if (t === '') return null;
  const n = parseInt(t, 10);
  return Number.isNaN(n) ? null : n;
}

function normalizeStatus(v) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return 0;
  if (n === 1) return 1;
  return 0;
}

function intOrZero(v) {
  const n = toIntOrNull(v);
  return n == null ? 0 : n;
}

function buildRecord(row, H) {
  const g = (k) => {
    const i = H[k];
    if (i === undefined) return '';
    const v = row[i];
    return v == null ? '' : String(v);
  };

  const id = parseInt(g('id'), 10);
  if (Number.isNaN(id)) return null;

  const name = g('name').trim() || `Clinic #${id}`;
  let url = g('url').trim();
  if (!url) {
    url = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  let title = g('title').trim();
  if (!title) title = name;

  const rawSearch = [g('search_text'), g('keyword')].map((x) => x.trim()).filter(Boolean);
  const searchText = rawSearch.join(' ').trim() || null;

  let baseMeta = {};
  const rawMeta = g('metadata').trim();
  if (rawMeta) {
    try {
      const p = JSON.parse(rawMeta);
      if (p && typeof p === 'object' && !Array.isArray(p)) baseMeta = p;
    } catch {
      /* ignore */
    }
  }

  const bcKeys = [
    'parent_id',
    'price_table',
    'equipment',
    'description',
    'keyword',
    'email',
    'phone_booking',
    'admin_note',
    'patient_guide',
    'phone_guide',
    'address_show',
    'insurrance_support',
    'filter_ids',
    'patient_guide_in',
    'patient_note',
    'appointment_success',
    'code',
    'booking_fee',
    'bc_id',
    'data',
    'package',
    'images',
    'schedules',
    'reason_ids',
    'feedback_total',
    'feedback_recommend',
    'feedback_recommend_percent',
    'price_max',
  ];
  const bookingcare = {};
  for (const k of bcKeys) {
    const v = g(k).trim();
    if (v !== '') bookingcare[k] = g(k);
  }
  const specRaw = g('specialist_ids').trim();
  if (specRaw !== '') bookingcare.specialist_ids = specRaw;

  const metadata = JSON.stringify({
    ...baseMeta,
    import_source: 'sql (5).csv',
    bookingcare,
  });

  return {
    id,
    name,
    url,
    picture: g('picture').trim() || null,
    address: g('address').trim() || null,
    summary: g('summary').trim() || null,
    content: g('content').trim() || null,
    title: title || null,
    created_at: toIntOrNull(g('created_at')),
    updated_at: toIntOrNull(g('updated_at')),
    status: normalizeStatus(g('status')),
    rank: toIntOrNull(g('rank')),
    price_min: toIntOrNull(g('price_min')),
    is_work: intOrZero(g('is_work')),
    service: intOrZero(g('service')),
    metadata,
    show_feedback: intOrZero(g('show_feedback')),
    sponsor: intOrZero(g('sponsor')),
    specialist_ids: '',
    province_id: toIntOrNull(g('province_id')),
    district_ids: g('district_ids').trim() || null,
    place_ids: g('place_ids').trim() || null,
    partner_ids: g('partner_ids').trim() || null,
    appointment_total: toIntOrNull(g('appointment_total')),
    sync_status: intOrZero(g('sync_status')),
    license: g('license').trim() || null,
    payment_method: intOrZero(g('payment_method')),
    payment_scope: intOrZero(g('payment_scope')),
    self_supported: intOrZero(g('self_supported')),
    show_in_root_place: intOrZero(g('show_in_root_place')),
    show_phone: intOrZero(g('show_phone')),
    forward_place: intOrZero(g('forward_place')),
    rebook_nextday_suggest: intOrZero(g('rebook_nextday_suggest')),
    search_text: searchText,
    approvers: g('approvers').trim() || null,
  };
}

function writeSplitFiles(headers, dataRows, records, H) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  const corePath = path.join(GENERATED_DIR, 'clinic_bookingcare_core.csv');
  const lines = [DB_COLUMNS.join(',')];
  for (const r of records) {
    lines.push(DB_COLUMNS.map((k) => csvEscapeCell(r[k])).join(','));
  }
  fs.writeFileSync(corePath, lines.join('\n'), 'utf8');

  const jsonlPath = path.join(GENERATED_DIR, 'clinic_bookingcare_source.jsonl');
  const out = fs.createWriteStream(jsonlPath);
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const id = parseInt(row[H['id']], 10);
    if (Number.isNaN(id)) continue;
    const src = {};
    headers.forEach((h, j) => {
      const v = row[j];
      if (v != null && String(v).trim() !== '') src[h] = v;
    });
    out.write(`${JSON.stringify({ id, source: src })}\n`);
  }
  out.end();
  console.log('Đã tách:', corePath);
  console.log('Đã tách:', jsonlPath);
}

const UPSERT_SQL = `
INSERT INTO tbl_clinic (
  id, name, url, picture, address, summary, content, title, created_at, updated_at,
  status, rank, price_min, is_work, service, metadata, show_feedback, sponsor,
  specialist_ids, province_id, district_ids, place_ids, partner_ids, appointment_total,
  sync_status, license, payment_method, payment_scope, self_supported,
  show_in_root_place, show_phone, forward_place, rebook_nextday_suggest, search_text, approvers
) VALUES (
  $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
  $11,$12,$13,$14,$15,$16,$17,$18,
  $19,$20,$21,$22,$23,$24,
  $25,$26,$27,$28,$29,$30,
  $31,$32,$33,$34,$35
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  url = EXCLUDED.url,
  picture = EXCLUDED.picture,
  address = EXCLUDED.address,
  summary = EXCLUDED.summary,
  content = EXCLUDED.content,
  title = EXCLUDED.title,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at,
  status = EXCLUDED.status,
  rank = EXCLUDED.rank,
  price_min = EXCLUDED.price_min,
  is_work = EXCLUDED.is_work,
  service = EXCLUDED.service,
  metadata = EXCLUDED.metadata,
  show_feedback = EXCLUDED.show_feedback,
  sponsor = EXCLUDED.sponsor,
  specialist_ids = EXCLUDED.specialist_ids,
  province_id = EXCLUDED.province_id,
  district_ids = EXCLUDED.district_ids,
  place_ids = EXCLUDED.place_ids,
  partner_ids = EXCLUDED.partner_ids,
  appointment_total = EXCLUDED.appointment_total,
  sync_status = EXCLUDED.sync_status,
  license = EXCLUDED.license,
  payment_method = EXCLUDED.payment_method,
  payment_scope = EXCLUDED.payment_scope,
  self_supported = EXCLUDED.self_supported,
  show_in_root_place = EXCLUDED.show_in_root_place,
  show_phone = EXCLUDED.show_phone,
  forward_place = EXCLUDED.forward_place,
  rebook_nextday_suggest = EXCLUDED.rebook_nextday_suggest,
  search_text = EXCLUDED.search_text,
  approvers = EXCLUDED.approvers
`;

function valuesFromRecord(r) {
  return DB_COLUMNS.map((k) => r[k]);
}

async function main() {
  const csvPath = process.argv[2] || DEFAULT_CSV;
  const dry = process.env.DRY_RUN === '1';
  const split = process.env.SPLIT_OUTPUT === '1';

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
  const H = Object.fromEntries(headers.map((h, i) => [h, i]));
  if (H.id === undefined || H.name === undefined) {
    console.error('CSV thiếu cột id hoặc name.');
    process.exit(1);
  }

  const dataRows = table.slice(1);
  const records = [];
  for (const row of dataRows) {
    const rec = buildRecord(row, H);
    if (rec) records.push(rec);
  }

  console.log('Đọc được', records.length, 'bản ghi từ', path.basename(csvPath));

  if (split) {
    writeSplitFiles(headers, dataRows, records, H);
  }

  if (dry) {
    console.log('DRY_RUN=1 — không ghi database.');
    process.exit(0);
  }

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
    for (const r of records) {
      await client.query(UPSERT_SQL, valuesFromRecord(r));
    }
    await client.query(
      `SELECT setval(
        pg_get_serial_sequence('tbl_clinic', 'id'),
        COALESCE((SELECT MAX(id) FROM tbl_clinic), 1)
      )`
    );
    await client.query('COMMIT');
    console.log('Đã UPSERT', records.length, 'dòng vào tbl_clinic.');
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
