const partnerRepo = require('./partner.repository');

exports.getPartners = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    partnerRepo.getAll({ ...query, limit, offset }),
    partnerRepo.count(query)
  ]);

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

exports.getPartnerById = async (id) => {
  return await partnerRepo.findById(id);
};

exports.createPartner = async (data) => {
  const now = Math.floor(Date.now() / 1000);
  data.created_time = now;
  data.updated_time = now;
  return await partnerRepo.create(data);
};

exports.updatePartner = async (id, data) => {
  data.updated_time = Math.floor(Date.now() / 1000);
  return await partnerRepo.update(id, data);
};

exports.deletePartner = async (id) => {
  return await partnerRepo.delete(id);
};
