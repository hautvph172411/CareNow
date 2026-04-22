const express = require('express');
const router = express.Router();

router.use('/location', require('../modules/location/location.router'));
router.use('/clinic_place', require('../modules/clinic_place/clinic_place.router'));
router.use('/clinic', require('../modules/clinic/clinic.router'));
router.use('/users', require('../modules/user/user.router'));
router.use('/specialties', require('../modules/specialty/specialty.router'));
router.use('/partner', require('../modules/partner/partner.routes'));
router.use('/auth', require('../modules/auth/auth_item.router'));

module.exports = router;
