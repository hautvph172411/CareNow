import axios from './axios';

export const getScheduleBlocks = async (params = {}) => {
  const res = await axios.get('/appointment-schedule/blocks', { params });
  return res.data;
};

export const getScheduleBlockById = async (id) => {
  const res = await axios.get(`/appointment-schedule/blocks/${id}`);
  return res.data;
};

export const createScheduleBlock = async (data) => {
  const res = await axios.post('/appointment-schedule/blocks', data);
  return res.data;
};

export const updateScheduleBlock = async (id, data) => {
  const res = await axios.put(`/appointment-schedule/blocks/${id}`, data);
  return res.data;
};

export const deleteScheduleBlock = async (id) => {
  const res = await axios.delete(`/appointment-schedule/blocks/${id}`);
  return res.data;
};

export const getSchedulePricePackages = async (clinicId) => {
  const res = await axios.get('/appointment-schedule/price-packages', { params: { clinic_id: clinicId } });
  return res.data;
};

export const getScheduleInsurancePackages = async (clinicId) => {
  const res = await axios.get('/appointment-schedule/insurance-packages', { params: { clinic_id: clinicId } });
  return res.data;
};

export const getScheduleOverrides = async (params = {}) => {
  const res = await axios.get('/appointment-schedule/overrides', { params });
  return res.data;
};

export const createScheduleOverride = async (data) => {
  const res = await axios.post('/appointment-schedule/overrides', data);
  return res.data;
};

export const deleteScheduleOverride = async (id) => {
  const res = await axios.delete(`/appointment-schedule/overrides/${id}`);
  return res.data;
};
