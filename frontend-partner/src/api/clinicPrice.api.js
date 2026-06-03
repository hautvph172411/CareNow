import axios from './axios';

export const getPricePackages = async (params = {}) => {
  const res = await axios.get('/clinic-price/packages', { params });
  return res.data;
};

export const getPricePackageDetail = async (id) => {
  const res = await axios.get(`/clinic-price/packages/${id}`);
  return res.data;
};

export const createPricePackage = async (data) => {
  const res = await axios.post('/clinic-price/packages', data);
  return res.data;
};

export const updatePricePackage = async (id, data) => {
  const res = await axios.put(`/clinic-price/packages/${id}`, data);
  return res.data;
};

export const deletePricePackage = async (id) => {
  const res = await axios.delete(`/clinic-price/packages/${id}`);
  return res.data;
};
