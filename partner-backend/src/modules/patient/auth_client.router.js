const express = require('express');
const router = express.Router();
const controller = require('./patient.controller');

// POST /api/auth/client/google-login
router.post('/google-login', controller.googleLogin);

module.exports = router;
