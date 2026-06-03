import axios from './axios';

export const getAllSettings = async () => {
  const res = await axios.get('/settings');
  return res.data;
};

export const getSettingByKey = async (key) => {
  const res = await axios.get(`/settings/${key}`);
  return res.data;
};

export const updateSettings = async (settingsObject) => {
  const res = await axios.put('/settings', settingsObject);
  return res.data;
};
