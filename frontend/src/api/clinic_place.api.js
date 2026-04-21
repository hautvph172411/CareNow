import axios from './axios';

export const getClinicPlaces = async (params = {}) => {
  const res = await axios.get('/clinic_place', { params });
  return res.data; // { success, data, pagination }
};

export const getClinicPlaceById = async (id) => {
  const res = await axios.get(`/clinic_place/${id}`);
  return res.data; // { success, data }
};

export const createClinicPlace = async (data) => {
  const res = await axios.post('/clinic_place', data);
  return res.data;
};

export const updateClinicPlace = async (id, data) => {
  const res = await axios.put(`/clinic_place/${id}`, data);
  return res.data;
};

export const deleteClinicPlace = async (id) => {
  const res = await axios.delete(`/clinic_place/${id}`);
  return res.data;
};
