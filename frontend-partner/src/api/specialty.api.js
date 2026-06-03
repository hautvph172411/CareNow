import axios from './axios';

export const getSpecialties = async (params = {}) => {
  const res = await axios.get('/specialties', { params });
  return res.data;
};

export const getSpecialtyById = async (id) => {
  const res = await axios.get(`/specialties/${id}`);
  return res.data;
};

export const createSpecialty = async (data) => {
  const res = await axios.post('/specialties', data);
  return res.data;
};

export const updateSpecialty = async (id, data) => {
  const res = await axios.put(`/specialties/${id}`, data);
  return res.data;
};

export const deleteSpecialty = async (id) => {
  const res = await axios.delete(`/specialties/${id}`);
  return res.data;
};
