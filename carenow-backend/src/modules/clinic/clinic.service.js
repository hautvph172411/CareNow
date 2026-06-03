const clinicRepo = require('./clinic.repository');

const emptyPriceSummary = () => ({
  min: null,
  max: null,
  currency: 'VND',
  package_count: 0,
  packages: [],
});

const emptyInsuranceSummary = () => ({
  package_count: 0,
  has_public: false,
  has_private: false,
  items: [],
});

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

const normalizePriceSummary = (summary) => {
  if (!summary) return emptyPriceSummary();
  const packages = Array.isArray(summary.packages) ? summary.packages : [];
  return {
    min: toNumberOrNull(summary.min),
    max: toNumberOrNull(summary.max),
    currency: 'VND',
    package_count: Number(summary.package_count) || packages.length,
    packages: packages.map((pkg) => ({
      ...pkg,
      min: toNumberOrNull(pkg.min),
      max: toNumberOrNull(pkg.max),
      items: Array.isArray(pkg.items)
        ? pkg.items.map((item) => ({ ...item, amount_vnd: toNumberOrNull(item.amount_vnd) }))
        : [],
    })),
  };
};

const normalizeInsuranceSummary = (summary) => {
  if (!summary) return emptyInsuranceSummary();
  return {
    package_count: Number(summary.package_count) || 0,
    has_public: !!summary.has_public,
    has_private: !!summary.has_private,
    items: Array.isArray(summary.items) ? summary.items : [],
  };
};

const attachFinanceSummaries = async (rows = [], query = {}) => {
  if (!Array.isArray(rows) || rows.length === 0) return rows;

  const clinicIds = rows.map((row) => row.id).filter(Boolean);
  const [priceMap, insuranceMap] = await Promise.all([
    clinicRepo.getPriceSummariesByClinicIds(clinicIds, query.place_id || null),
    clinicRepo.getInsuranceSummariesByClinicIds(clinicIds, query.place_id || null, query.partner_id || null),
  ]);

  return rows.map((row) => ({
    ...row,
    price_summary: normalizePriceSummary(priceMap.get(Number(row.id))),
    insurance_summary: normalizeInsuranceSummary(insuranceMap.get(Number(row.id))),
  }));
};

exports.getClinics = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const offset = (page - 1) * limit;

  const [rows, total] = await Promise.all([
    clinicRepo.getAll({ ...query, limit, offset }),
    clinicRepo.count(query)
  ]);
  const data = await attachFinanceSummaries(rows, query);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

exports.createClinic = async (data) => {
  // Add timestamps
  data.created_at = Math.floor(Date.now() / 1000);
  data.updated_at = Math.floor(Date.now() / 1000);
  return await clinicRepo.create(data);
};

exports.getClinicById = async (id, query = {}) => {
  const row = await clinicRepo.findById(id);
  if (!row) return row;
  const [data] = await attachFinanceSummaries([row], query);
  return data;
};

exports.updateClinic = async (id, data) => {
  data.updated_at = Math.floor(Date.now() / 1000);
  return await clinicRepo.update(id, data);
};

exports.deleteClinic = async (id) => {
  const apptCount = await clinicRepo.countAppointments(id);
  if (apptCount > 0) {
    const err = new Error('Không thể xóa bác sĩ đang có lịch hẹn');
    err.status = 400;
    throw err;
  }
  return await clinicRepo.delete(id);
};
