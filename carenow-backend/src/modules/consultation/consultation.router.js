const express = require('express');
const router = express.Router();
const controller = require('./consultation.controller');
const authAdmin = require('../middlewares/auth');
const roleCheck = require('../middlewares/role');

// Public route for patients to submit a consultation request
router.post('/', controller.create);

// Admin routes
router.get('/unread-count', authAdmin, roleCheck(1), controller.getUnreadCount);
router.get('/', authAdmin, roleCheck(1), controller.getAll);
router.patch('/:id/status', authAdmin, roleCheck(1), controller.updateStatus);
router.delete('/:id', authAdmin, roleCheck(1), controller.delete);

module.exports = router;
