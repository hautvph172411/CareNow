const express = require('express');
const router = express.Router();
const controller = require('./specialty.controller');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/role');

// Public routes (if needed)
router.get('/', controller.getSpecialties); // usually public or admin
router.get('/:id', controller.getSpecialtyById);

// Protected routes
router.post('/', auth, roleCheck(1), controller.createSpecialty);
router.put('/:id', auth, roleCheck(1), controller.updateSpecialty);
router.delete('/:id', auth, roleCheck(1), controller.deleteSpecialty);

module.exports = router;
