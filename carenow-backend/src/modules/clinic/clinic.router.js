const express = require('express');
const router = express.Router();
const controller = require('./clinic.controller');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/role');

router.get('/', controller.getClinics);
router.get('/:id', controller.getClinicById);
router.post('/', auth, roleCheck(1), controller.createClinic);
router.put('/:id', auth, roleCheck(1), controller.updateClinic);
router.delete('/:id', auth, roleCheck(1), controller.deleteClinic);

module.exports = router;
