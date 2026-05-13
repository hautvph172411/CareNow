import axios from "./axios";

/** Lấy danh sách tỉnh/thành phố */
export const getProvinces = async () => {
  const res = await axios.get("/location/provinces");
  return res.data?.data || [];
};

/** Lấy danh sách phường/xã (ward) thuộc 1 tỉnh/thành */
export const getWardsByProvince = async (provinceId) => {
  const res = await axios.get("/location/wards", { params: { province_id: provinceId } });
  return res.data?.data || [];
};
