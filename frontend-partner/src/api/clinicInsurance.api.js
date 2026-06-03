import axios from './axios';

export const getInsurancePackages = async (params = {}) => {
  const res = await axios.get('/clinic-insurance/packages', { params });
  return res.data;
};

export const getInsurancePackageDetail = async (id) => {
  const res = await axios.get(`/clinic-insurance/packages/${id}`);
  return res.data;
};

export const createInsurancePackage = async (data) => {
  const res = await axios.post('/clinic-insurance/packages', data);
  return res.data;
};

export const updateInsurancePackage = async (id, data) => {
  const res = await axios.put(`/clinic-insurance/packages/${id}`, data);
  return res.data;
};

export const deleteInsurancePackage = async (id) => {
  const res = await axios.delete(`/clinic-insurance/packages/${id}`);
  return res.data;
};
