import axios from './axios';

export const getDashboardStats = async () => {
  const res = await axios.get('/dashboard/stats');
  return res.data;
};
