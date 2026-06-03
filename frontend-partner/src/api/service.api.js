import axios from './axios';

export const getServices = async (params = {}) => {
  const res = await axios.get('/services', { params });
  return res.data;
};

export const getServiceById = async (id) => {
  const res = await axios.get(`/services/${id}`);
  return res.data;
};

export const createService = async (data) => {
  const res = await axios.post('/services', data);
  return res.data;
};

export const updateService = async (id, data) => {
  const res = await axios.put(`/services/${id}`, data);
  return res.data;
};

export const deleteService = async (id) => {
  const res = await axios.delete(`/services/${id}`);
  return res.data;
};
