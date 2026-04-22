import axios from './axios';

export const getPartners = async (params = {}) => {
  const res = await axios.get('/partner', { params });
  return res.data;
};

export const getPartnerById = async (id) => {
  const res = await axios.get(`/partner/${id}`);
  return res.data;
};

export const createPartner = async (data) => {
  const res = await axios.post('/partner', data);
  return res.data;
};

export const updatePartner = async (id, data) => {
  const res = await axios.put(`/partner/${id}`, data);
  return res.data;
};

export const deletePartner = async (id) => {
  const res = await axios.delete(`/partner/${id}`);
  return res.data;
};
