import axios from './axios';

export const getUsers = async (params = {}) => {
  const res = await axios.get('/users', { params });
  return res.data;
};

export const getUserById = async (id) => {
  const res = await axios.get(`/users/${id}`);
  return res.data;
};

export const createUser = async (data) => {
  const res = await axios.post('/users', data);
  return res.data;
};

export const updateUser = async (id, data) => {
  const res = await axios.put(`/users/${id}`, data);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await axios.delete(`/users/${id}`);
  return res.data;
};
