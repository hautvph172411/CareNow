import axios from './axios';

export const getProvinces = async () => {
  const res = await axios.get('/location/provinces');
  return res.data?.data || [];
};

export const getDistrictsByProvince = async (provinceId) => {
  const res = await axios.get(`/location/districts/${provinceId}`);
  return res.data?.data || [];
};

export const getWardsByProvince = async (provinceId) => {
  const res = await axios.get(`/location/wards/${provinceId}`);
  return res.data?.data || [];
};
