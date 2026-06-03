const express = require('express');
const router = express.Router();
const controller = require('./clinic_reason.controller');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/role');

router.get('/', controller.list);
router.get('/:id', controller.detail);

router.post('/', auth, roleCheck(1), controller.create);
router.put('/:id', auth, roleCheck(1), controller.update);
router.delete('/:id', auth, roleCheck(1), controller.remove);

module.exports = router;
