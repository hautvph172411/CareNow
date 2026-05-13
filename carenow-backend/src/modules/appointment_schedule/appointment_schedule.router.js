const express = require('express');
const router = express.Router();
const ctrl = require('./appointment_schedule.controller');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/role');

// Dropdown / phụ trợ (admin)
router.get('/blocks', ctrl.listBlocks);
router.get('/blocks/:id', ctrl.getBlock);
router.get('/price-packages', ctrl.listPricePackages);
router.get('/insurance-packages', ctrl.listInsurancePackages);
router.get('/overrides', ctrl.listOverrides);

router.post('/blocks', auth, roleCheck(1), ctrl.createBlock);
router.put('/blocks/:id', auth, roleCheck(1), ctrl.updateBlock);
router.delete('/blocks/:id', auth, roleCheck(1), ctrl.deleteBlock);

router.post('/overrides', auth, roleCheck(1), ctrl.createOverride);
router.delete('/overrides/:id', auth, roleCheck(1), ctrl.deleteOverride);

module.exports = router;
