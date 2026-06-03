import axios from './axios';

export const getAuthItems = async () => {
    const res = await axios.get('/auth/items');
    return res.data;
};

export const createAuthItem = async (data) => {
    const res = await axios.post('/auth/items', data);
    return res.data;
};

export const updateAuthItem = async (name, data) => {
    const res = await axios.put(`/auth/items/${name}`, data);
    return res.data;
};

export const deleteAuthItem = async (name) => {
    const res = await axios.delete(`/auth/items/${name}`);
    return res.data;
};

// Parent-child: set toàn bộ quyền cho 1 vai trò
export const getItemChildren = async (name) => {
    const res = await axios.get(`/auth/items/${name}/children`);
    return res.data;
};

export const setItemChildren = async (name, children) => {
    const res = await axios.post(`/auth/items/${name}/children`, { children });
    return res.data;
};

// Assignment: gán vai trò cho user
export const assignToUser = async (userId, items) => {
    const res = await axios.post('/auth/assign', { userId, items });
    return res.data;
};

export const getUserAssignments = async (userId) => {
    const res = await axios.get(`/auth/assignments/${userId}`);
    return res.data;
};

// Effective permissions (flat)
export const getUserPermissions = async (userId) => {
    const res = await axios.get(`/auth/user/${userId}/permissions`);
    return res.data;
};

export const getMyPermissions = async () => {
    const res = await axios.get('/auth/me/permissions');
    return res.data;
};

// Sync toàn bộ feature catalog -> permission trong DB
export const syncFeatures = async (features) => {
    const res = await axios.post('/auth/items/sync-features', { features });
    return res.data;
};
