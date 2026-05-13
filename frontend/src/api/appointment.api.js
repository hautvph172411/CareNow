import axios from './axios';

export const getAppointments = async (params = {}) => {
  const res = await axios.get('/appointments', { params });
  return res.data;
};

export const createAppointment = async (data) => {
  const res = await axios.post('/appointments', data);
  return res.data;
};

export const updateAppointment = async (id, data) => {
  const res = await axios.put(`/appointments/${id}`, data);
  return res.data;
};

export const updateAppointmentStatus = async (id, data) => {
  const res = await axios.patch(`/appointments/${id}/status`, data);
  return res.data;
};

export const deleteAppointment = async (id) => {
  const res = await axios.delete(`/appointments/${id}`);
  return res.data;
};
