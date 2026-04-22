const express = require('express');
const router = express.Router();
const controller = require('./location.controller');

router.get('/provinces', controller.getProvinces);
router.get('/districts/:provinceId', controller.getDistrictsByProvince);
router.get('/wards/:provinceId', controller.getWardsByProvince);

module.exports = router;
