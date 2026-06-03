import axios from './axios';

export const getAllSettings = async () => {
  const res = await axios.get('/settings');
  return res.data;
};
