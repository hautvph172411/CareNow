const express = require('express');
const router = express.Router();
const controller = require('./doctor.controller');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/role');

// Đăng nhập mới xem được
router.get('/', auth, controller.list);
router.get('/:id', auth, controller.detail);

// Chỉ admin (role = 1) mới được thêm/sửa/xoá
router.post('/', auth, roleCheck(1), controller.create);
router.put('/:id', auth, roleCheck(1), controller.update);
router.delete('/:id', auth, roleCheck(1), controller.remove);

module.exports = router;
