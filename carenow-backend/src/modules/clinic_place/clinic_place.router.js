const express = require('express');
const router = express.Router();
const controller = require('./clinic_place.controller');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/role');

router.get('/',    controller.getClinicPlaces);
router.get('/:id', controller.getClinicPlaceById);
router.post('/',   auth, roleCheck(1), controller.createClinicPlace);
router.put('/:id', auth, roleCheck(1), controller.updateClinicPlace);
router.delete('/:id', auth, roleCheck(1), controller.deleteClinicPlace);

module.exports = router;
