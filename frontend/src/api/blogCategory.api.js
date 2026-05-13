import axios from './axios';

export const getBlogCategories = async (params = {}) => {
  const res = await axios.get('/blog-categories', { params });
  return res.data;
};

export const getBlogCategoryById = async (id) => {
  const res = await axios.get(`/blog-categories/${id}`);
  return res.data;
};

export const createBlogCategory = async (data) => {
  const res = await axios.post('/blog-categories', data);
  return res.data;
};

export const updateBlogCategory = async (id, data) => {
  const res = await axios.put(`/blog-categories/${id}`, data);
  return res.data;
};

export const deleteBlogCategory = async (id) => {
  const res = await axios.delete(`/blog-categories/${id}`);
  return res.data;
};
