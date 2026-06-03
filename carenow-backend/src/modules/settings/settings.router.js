const express = require('express');
const router = express.Router();
const controller = require('./settings.controller');
const verifyToken = require('../middlewares/auth');
const checkRole = require('../middlewares/role');

// Public route for fetching settings
router.get('/', controller.getAllSettings);
router.get('/:key', controller.getSettingByKey);

// Protected route for updating settings (Admin only)
router.put('/', verifyToken, checkRole(1), controller.updateSettings);

module.exports = router;
