const express = require('express');
const router  = express.Router();
const ctrl    = require('./location.controller');

router.get('/provinces', ctrl.getProvinces);
router.get('/wards',     ctrl.getWards);      // ?province_id=X

module.exports = router;
