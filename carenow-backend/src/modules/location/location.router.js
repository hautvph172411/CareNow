const express = require('express');
const router = express.Router();
const controller = require('./location.controller');

router.get('/provinces', controller.getProvinces);
router.get('/wards/:provinceId', controller.getWardsByProvince);

module.exports = router;
