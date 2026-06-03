const repo = require('./clinic_price.repository');

const now = () => Math.floor(Date.now() / 1000);

const nullIfEmpty = (v) => (v === '' || v === undefined ? null : v);

const parseItemRow = (it) => {
  const o = {
    clinic_place_id: it.clinic_place_id === '' || it.clinic_place_id == null ? null : parseInt(it.clinic_place_id, 10),
    effective_from: it.effective_from,
    effective_to: nullIfEmpty(it.effective_to),
    day_of_week: it.day_of_week === '' || it.day_of_week == null || it.day_of_week === 'all' ? null : parseInt(it.day_of_week, 10),
    session_type:
      it.session_type === '' || it.session_type == null || it.session_type === 'all' ? null : parseInt(it.session_type, 10),
    amount_vnd: parseInt(String(it.amount_vnd).replace(/\D/g, ''), 10),
    currency: it.currency || 'VND',
    label: nullIfEmpty(it.label),
    status: it.status !== undefined ? parseInt(it.status, 10) : 1,
    rank: it.rank !== undefined ? parseInt(it.rank, 10) : 99,
  };
  if (!o.effective_from) throw new Error('Mỗi dòng giá cần effective_from');
  if (Number.isNaN(o.amount_vnd) || o.amount_vnd < 0) throw new Error('amount_vnd không hợp lệ');
  if (o.day_of_week !== null && (o.day_of_week < 0 || o.day_of_week > 6)) throw new Error('day_of_week 0–6');
  if (o.session_type !== null && (o.session_type < 1 || o.session_type > 4)) throw new Error('session_type 1–4');
  return o;
};

exports.getPackages = async (query) => {
  const limit = query.limit ? parseInt(query.limit, 10) : 20;
  const page = query.page ? parseInt(query.page, 10) : 1;
  const filters = {
    limit,
    offset: (page - 1) * limit,
    clinic_id: query.clinic_id,
    keyword: query.keyword,
    status: query.status,
  };
  const data = await repo.findPackages(filters);
  const total = await repo.countPackages(filters);
  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 } };
};

exports.getPackageDetail = async (id) => {
  const pkg = await repo.findPackageById(id);
  if (!pkg) throw new Error('NOT_FOUND');
  const items = await repo.findItemsByPackageId(id);
  return { ...pkg, items };
};

exports.createPackage = async (body) => {
  if (!body.clinic_id) throw new Error('Thiếu bác sĩ');
  if (!body.name || !String(body.name).trim()) throw new Error('Tên gói không được để trống');

  const itemsInput = Array.isArray(body.items) ? body.items : [];
  const itemsPayload = itemsInput.map((it) => parseItemRow(it));

  const pkgPayload = {
    clinic_id: parseInt(body.clinic_id, 10),
    name: String(body.name).trim(),
    description: nullIfEmpty(body.description),
    status: body.status !== undefined ? parseInt(body.status, 10) : 1,
    rank: body.rank !== undefined ? parseInt(body.rank, 10) : 99,
    created_at: now(),
    updated_at: now(),
  };

  const pkg = await repo.createPackageWithItems(pkgPayload, itemsPayload);
  return exports.getPackageDetail(pkg.id);
};

exports.updatePackage = async (id, body) => {
  const existing = await repo.findPackageById(id);
  if (!existing) throw new Error('NOT_FOUND');

  const pkgPayload = {
    name: body.name !== undefined ? String(body.name).trim() : existing.name,
    description: body.description !== undefined ? nullIfEmpty(body.description) : existing.description,
    status: body.status !== undefined ? parseInt(body.status, 10) : existing.status,
    rank: body.rank !== undefined ? parseInt(body.rank, 10) : existing.rank,
    updated_at: now(),
  };
  if (!pkgPayload.name) throw new Error('Tên gói không được để trống');

  await repo.updatePackage(id, pkgPayload);

  if (Array.isArray(body.items)) {
    const itemsPayload = body.items.map((it) => parseItemRow(it));
    await repo.replaceItems(id, itemsPayload);
  }

  return exports.getPackageDetail(id);
};

exports.deletePackage = async (id) => {
  const row = await repo.deletePackage(id);
  if (!row) throw new Error('NOT_FOUND');
  return row;
};
