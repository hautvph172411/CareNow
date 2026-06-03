import axios from './axios';

export const getBlogPublicList = async (params = {}) => {
  const res = await axios.get('/blog-public', { params });
  return res.data;
};

export const getBlogPublicById = async (id) => {
  const res = await axios.get(`/blog-public/${id}`);
  return res.data;
};

export const createBlogPublic = async (data) => {
  const res = await axios.post('/blog-public', data);
  return res.data;
};

export const updateBlogPublic = async (id, data) => {
  const res = await axios.put(`/blog-public/${id}`, data);
  return res.data;
};

export const deleteBlogPublic = async (id) => {
  const res = await axios.delete(`/blog-public/${id}`);
  return res.data;
};
