const repo = require('./clinic_place.repository');

/** Chỉ các cột tồn tại trên tbl_clinic_place (schema cốt lõi) */
const ALLOWED_KEYS = new Set([
  'name',
  'short_name',
  'display_name',
  'province_id',
  'district_id',
  'address',
  'info',
  'status',
  'partner_id',
  'parent_id',
  'page_content_blocks',
  'show_children',
  'created_at',
  'updated_at',
  'admin_note',
  'has_insurance',
  'patient_guide',
  'address_guide',
  'images',
  'phone',
  'title',
  'description',
  'url',
  'description_detail',
  'logo',
  'page_type',
  'rank',
  'order',
  'custom_button_text',
  'custom_button_link',
  'metadata',
  'self_supported',
]);

const triBool = (v, def = false) => {
  if (v === true || v === 1 || v === '1') return true;
  if (v === false || v === 0 || v === '0') return false;
  if (v === '' || v === null || v === undefined) return def;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? def : Boolean(n);
};

const cleanPayload = (data) => {
  const payload = {};
  for (const k of ALLOWED_KEYS) {
    if (Object.prototype.hasOwnProperty.call(data, k)) payload[k] = data[k];
  }

  const intFields = ['status', 'order', 'rank', 'page_type', 'self_supported'];
  intFields.forEach((field) => {
    if (!Object.prototype.hasOwnProperty.call(payload, field)) return;
    if (payload[field] !== undefined && payload[field] !== null && payload[field] !== '') {
      payload[field] = parseInt(payload[field], 10);
    } else {
      if (field === 'order') payload[field] = 99;
      else if (field === 'page_type' || field === 'self_supported') payload[field] = 0;
      else payload[field] = null;
    }
  });

  ['province_id', 'district_id', 'partner_id', 'parent_id'].forEach((field) => {
    if (!Object.prototype.hasOwnProperty.call(payload, field)) return;
    if (payload[field] === '' || payload[field] === undefined || payload[field] === null) {
      payload[field] = null;
    } else {
      payload[field] = parseInt(payload[field], 10);
    }
  });

  if (Object.prototype.hasOwnProperty.call(payload, 'has_insurance')) {
    payload.has_insurance = triBool(payload.has_insurance, false);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'show_children')) {
    payload.show_children = triBool(payload.show_children, false);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'page_content_blocks')) {
    let blocks = payload.page_content_blocks;
    if (typeof blocks === 'string') {
      try {
        blocks = JSON.parse(blocks);
      } catch {
        blocks = [];
      }
    }
    if (!Array.isArray(blocks)) blocks = [];
    payload.page_content_blocks = blocks.map((b) => ({
      title: typeof b?.title === 'string' ? b.title : '',
      body: typeof b?.body === 'string' ? b.body : '',
    }));
  }

  payload.updated_at = Math.floor(Date.now() / 1000);

  Object.keys(payload).forEach((key) => {
    if (key === 'page_content_blocks') return;
    if (payload[key] === '') {
      payload[key] = null;
    }
  });

  return payload;
};

const getPlaceKindFromMeta = (metadata) => {
  if (metadata == null || metadata === '') return null;
  try {
    const m = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    if (m && m.place_kind !== undefined && m.place_kind !== null && m.place_kind !== '') {
      const n = parseInt(m.place_kind, 10);
      return Number.isNaN(n) ? null : n;
    }
  } catch {
    return null;
  }
  return null;
};

/** Khi không có metadata.place_kind: suy luận từ cây parent_id (best-effort) */
const inferKindFromParentChain = (row, byId) => {
  const p = row.parent_id ? byId[row.parent_id] : null;
  if (!p) return 5;
  if (!p.parent_id) return 4;
  const gp = byId[p.parent_id];
  if (!gp) return 4;
  if (!gp.parent_id) return 3;
  return 2;
};

const mergePlaceKindIntoMetadata = (data) => {
  if (!data || !Object.prototype.hasOwnProperty.call(data, 'place_kind')) return;
  const pk = parseInt(data.place_kind, 10);
  delete data.place_kind;
  if (Number.isNaN(pk)) return;
  let metaObj = {};
  const raw = data.metadata;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const p = JSON.parse(raw);
      if (p && typeof p === 'object' && !Array.isArray(p)) metaObj = { ...p };
    } catch {
      metaObj = {};
    }
  } else if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    metaObj = { ...raw };
  }
  metaObj.place_kind = pk;
  data.metadata = JSON.stringify(metaObj);
};

const attachPlaceKindForResponse = (row) => {
  if (!row) return row;
  const pk = getPlaceKindFromMeta(row.metadata);
  return { ...row, place_kind: pk != null && !Number.isNaN(pk) ? pk : 3 };
};

/** Loại được phép làm cha (theo loại đang chọn), cùng partner — khớp FE */
const computeEffectiveKind = (row, byId) => {
  const fromMeta = getPlaceKindFromMeta(row.metadata);
  if (fromMeta != null && !Number.isNaN(fromMeta)) return fromMeta;
  return inferKindFromParentChain(row, byId);
};

const parentKindsForChild = (placeKind) => {
  const k = parseInt(placeKind, 10);
  if (Number.isNaN(k)) return [];
  switch (k) {
    case 0:
      return [2, 3, 4, 5];
    case 1:
      return [2];
    case 2:
      return [4, 5];
    case 3:
      return [4];
    case 4:
      return [5];
    case 5:
    default:
      return [];
  }
};

exports.listParentOptions = async (query = {}) => {
  const partnerId =
    query.partner_id != null && query.partner_id !== '' ? parseInt(query.partner_id, 10) : NaN;
  const placeKind =
    query.place_kind != null && query.place_kind !== '' ? parseInt(query.place_kind, 10) : NaN;
  const excludeRaw = query.exclude_id;
  const excludeId =
    excludeRaw != null && excludeRaw !== '' ? parseInt(excludeRaw, 10) : null;

  if (!partnerId || Number.isNaN(partnerId)) throw new Error('Thiếu partner_id');
  if (Number.isNaN(placeKind)) throw new Error('Thiếu place_kind');

  const allowedKinds = parentKindsForChild(placeKind);
  if (allowedKinds.length === 0) return [];

  const rows = await repo.findPartnerPlacesForParentPick({
    partnerId,
    excludeId: excludeId && !Number.isNaN(excludeId) ? excludeId : null,
  });
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  const allowed = new Set(allowedKinds);

  return rows
    .filter((r) => allowed.has(computeEffectiveKind(r, byId)))
    .map((r) => ({
      id: r.id,
      name: r.name,
      display_name: r.display_name,
      short_name: r.short_name,
      place_kind: computeEffectiveKind(r, byId),
    }));
};

exports.getClinicPlaces = async (query = {}) => {
  const limit = query.limit ? parseInt(query.limit) : 20;
  const page = query.page ? parseInt(query.page) : 1;
  const offset = (page - 1) * limit;

  const filters = {
    limit,
    offset,
    keyword: query.keyword,
    status: query.status,
    province_id: query.province_id,
    partner_id: query.partner_id,
  };

  const rows = await repo.getAll(filters);
  const total = await repo.count(filters);

  return {
    data: rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

exports.getClinicPlaceById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw new Error('NOT_FOUND');
  if (!item.partner_id) {
    const pk = getPlaceKindFromMeta(item.metadata);
    return { ...item, place_kind: pk != null && !Number.isNaN(pk) ? pk : 3 };
  }
  const peers = await repo.findPartnerPlacesForParentPick({
    partnerId: item.partner_id,
    excludeId: null,
  });
  const byId = Object.fromEntries(peers.map((r) => [r.id, r]));
  byId[item.id] = item;
  const pk = getPlaceKindFromMeta(item.metadata) ?? inferKindFromParentChain(item, byId);
  return { ...item, place_kind: pk };
};

exports.createClinicPlace = async (data) => {
  if (!data.name) throw new Error('Tên cơ sở y tế không được để trống');

  const raw = { ...data };
  mergePlaceKindIntoMetadata(raw);
  if (!raw.created_at) raw.created_at = Math.floor(Date.now() / 1000);
  const payload = cleanPayload(raw);
  const row = await repo.create(payload);
  return attachPlaceKindForResponse(row);
};

exports.updateClinicPlace = async (id, data) => {
  const exists = await repo.findById(id);
  if (!exists) throw new Error('NOT_FOUND');

  const raw = { ...data };
  mergePlaceKindIntoMetadata(raw);
  const payload = cleanPayload(raw);
  delete payload.created_at;

  const updated = await repo.update(id, payload);
  if (!updated) throw new Error('Không có trường nào được cập nhật');
  return attachPlaceKindForResponse(updated);
};

exports.deleteClinicPlace = async (id) => {
  const deleted = await repo.remove(id);
  if (!deleted) throw new Error('NOT_FOUND');
  return deleted;
};
