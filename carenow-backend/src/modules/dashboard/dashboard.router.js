const express = require('express');
const router = express.Router();
const controller = require('./dashboard.controller');
const verifyToken = require('../middlewares/auth');

router.get('/stats', verifyToken, controller.getStats);

module.exports = router;
