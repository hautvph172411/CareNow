const express = require('express');
const router = express.Router();
const ctrl = require('./clinic_price.controller');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/role');

router.get('/packages', ctrl.list);
router.get('/packages/:id', ctrl.detail);
router.post('/packages', auth, roleCheck(1), ctrl.create);
router.put('/packages/:id', auth, roleCheck(1), ctrl.update);
router.delete('/packages/:id', auth, roleCheck(1), ctrl.remove);

module.exports = router;
