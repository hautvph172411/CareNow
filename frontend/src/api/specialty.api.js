import axios from 'axios';

const API_URL = 'http://localhost:3000/api/specialties';

export const getSpecialties = async (params = {}) => {
  return await axios.get(API_URL, { params });
};

export const getSpecialtyById = async (id) => {
  return await axios.get(`${API_URL}/${id}`);
};

export const createSpecialty = async (data) => {
  const token = localStorage.getItem('token');
  return await axios.post(API_URL, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const updateSpecialty = async (id, data) => {
  const token = localStorage.getItem('token');
  return await axios.put(`${API_URL}/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const deleteSpecialty = async (id) => {
  const token = localStorage.getItem('token');
  return await axios.delete(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
