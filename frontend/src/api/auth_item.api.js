import axios from './axios';

export const getAuthItems = async () => {
    const res = await axios.get('/auth/items');
    return res.data;
};

export const createAuthItem = async (data) => {
    const res = await axios.post('/auth/items', data);
    return res.data;
};

export const deleteAuthItem = async (name) => {
    const res = await axios.delete(`/auth/items/${name}`);
    return res.data;
};

export const assignToUser = async (userId, items) => {
    const res = await axios.post('/auth/assign', { userId, items });
    return res.data;
};

export const getUserAssignments = async (userId) => {
    const res = await axios.get(`/auth/assignments/${userId}`);
    return res.data;
};
