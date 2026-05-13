const express = require('express');
const router = express.Router();
const controller = require('./patient.controller');
const authClient = require('../middlewares/auth_client');

// === Patient cần token (type=patient) — gọi từ carenow-client ===
router.get('/me', authClient, controller.getMe);
router.put('/me', authClient, controller.updateMe);

// === Admin endpoints — quản lý danh sách bệnh nhân (sẽ thêm permission check sau) ===
router.get('/', controller.list);
router.get('/:id', controller.getById);

module.exports = router;
