const express      = require('express');
const router       = express.Router();
const controller   = require('./appointment.controller');
const authClient   = require('../middlewares/auth_client');
const softAuth     = require('../middlewares/soft_auth_client');
const adminAuth    = require('../middlewares/auth');
const roleCheck    = require('../middlewares/role');

/* ── Routes công khai (guest có thể đặt lịch) ─────────────────────────────── */
// softAuth: parse JWT nếu có → req.patient, không bắt buộc
router.post('/', softAuth, controller.createAppointment);

/* ── Routes yêu cầu đăng nhập bệnh nhân ──────────────────────────────────── */
router.get('/my',         authClient, controller.getMyAppointments);
router.patch('/:id/cancel', authClient, controller.cancelAppointment);
router.get('/:id',        authClient, controller.getAppointmentById);

/* ── Routes admin ─────────────────────────────────────────────────────────── */
router.get('/',             adminAuth, roleCheck(1), controller.getAllAppointments);
router.put('/:id',          adminAuth, roleCheck(1), controller.updateAppointment);
router.delete('/:id',       adminAuth, roleCheck(1), controller.deleteAppointment);
router.patch('/:id/status', adminAuth, roleCheck(1), controller.updateAppointmentStatus);

module.exports = router;
