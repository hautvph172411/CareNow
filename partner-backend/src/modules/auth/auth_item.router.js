const express = require('express');
const router = express.Router();
const controller = require('./auth_item.controller');
const auth = require('../middlewares/auth');

// Items (role + permission chung 1 bảng, phân biệt bằng type)
router.get('/items', controller.getItems);
router.post('/items', controller.createItem);
router.put('/items/:name', controller.updateItem);
router.delete('/items/:name', controller.deleteItem);

// Đồng bộ danh sách tính năng từ frontend -> upsert permission
router.post('/items/sync-features', controller.syncFeatures);

// Quan hệ parent-child (role -> permissions)
router.get('/items/:name/children', controller.getItemChildren);
router.post('/items/:name/children', controller.setItemChildren);

// Gán role/permission cho user
router.post('/assign', controller.assignToUser);
router.get('/assignments/:userId', controller.getUserAssignments);

// Lấy effective permissions (phẳng) cho user bất kỳ và cho user hiện tại
router.get('/user/:userId/permissions', controller.getUserPermissions);
router.get('/me/permissions', auth, controller.getMyPermissions);

module.exports = router;
