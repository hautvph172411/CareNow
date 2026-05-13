import axios from './axios';

export const getClinicReasons = async (params = {}) => {
  const res = await axios.get('/clinic-reasons', { params });
  return res.data;
};

export const getClinicReasonById = async (id) => {
  const res = await axios.get(`/clinic-reasons/${id}`);
  return res.data;
};

export const createClinicReason = async (data) => {
  const res = await axios.post('/clinic-reasons', data);
  return res.data;
};

export const updateClinicReason = async (id, data) => {
  const res = await axios.put(`/clinic-reasons/${id}`, data);
  return res.data;
};

export const deleteClinicReason = async (id) => {
  const res = await axios.delete(`/clinic-reasons/${id}`);
  return res.data;
};
