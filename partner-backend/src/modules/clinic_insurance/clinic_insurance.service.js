const repo = require('./clinic_insurance.repository');

const now = () => Math.floor(Date.now() / 1000);

const nullIfEmpty = (v) => (v === '' || v === undefined ? null : v);

const parseItemRow = (it) => {
  const o = {
    clinic_place_id:
      it.clinic_place_id === '' || it.clinic_place_id == null ? null : parseInt(it.clinic_place_id, 10),
    insurer_name: String(it.insurer_name || '').trim(),
    insurer_code: nullIfEmpty(it.insurer_code),
    coverage_note: nullIfEmpty(it.coverage_note),
    copay_note: nullIfEmpty(it.copay_note),
    requires_referral: !!it.requires_referral,
    status: it.status !== undefined ? parseInt(it.status, 10) : 1,
    rank: it.rank !== undefined ? parseInt(it.rank, 10) : 99,
  };
  if (!o.insurer_name) throw new Error('Mỗi dòng BH cần insurer_name');
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
    partner_id:
      body.partner_id === '' || body.partner_id == null ? null : parseInt(body.partner_id, 10),
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
    partner_id:
      body.partner_id !== undefined
        ? body.partner_id === '' || body.partner_id == null
          ? null
          : parseInt(body.partner_id, 10)
        : existing.partner_id,
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
