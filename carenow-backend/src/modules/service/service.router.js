const express = require('express');
const router = express.Router();
const controller = require('./service.controller');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/role');

// Public — list & detail (FE client cũng có thể cần)
router.get('/', controller.list);
router.get('/:id', controller.detail);

// Admin only
router.post('/',       auth, roleCheck(1), controller.create);
router.put('/:id',     auth, roleCheck(1), controller.update);
router.delete('/:id',  auth, roleCheck(1), controller.remove);

module.exports = router;
