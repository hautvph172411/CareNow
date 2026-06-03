import axios from './axios';

export const getClinics = async (params = {}) => {
  const res = await axios.get('/clinic', { params });
  return res.data;
};

export const getClinicById = async (id) => {
  const res = await axios.get(`/clinic/${id}`);
  return res.data;
};

export const createClinic = async (data) => {
  const res = await axios.post('/clinic', data);
  return res.data;
};

export const updateClinic = async (id, data) => {
  const res = await axios.put(`/clinic/${id}`, data);
  return res.data;
};

export const deleteClinic = async (id) => {
  const res = await axios.delete(`/clinic/${id}`);
  return res.data;
};
