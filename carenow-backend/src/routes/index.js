const express = require('express');
const router = express.Router();

router.use('/location', require('../modules/location/location.router'));
router.use('/clinic_place', require('../modules/clinic_place/clinic_place.router'));
router.use('/clinic', require('../modules/clinic/clinic.router'));
router.use('/users', require('../modules/user/user.router'));
router.use('/specialties', require('../modules/specialty/specialty.router'));
router.use('/services',    require('../modules/service/service.router'));
router.use('/appointment-schedule', require('../modules/appointment_schedule/appointment_schedule.router'));
router.use('/clinic-price', require('../modules/clinic_price/clinic_price.router'));
router.use('/clinic-insurance', require('../modules/clinic_insurance/clinic_insurance.router'));
router.use('/partner', require('../modules/partner/partner.routes'));
router.use('/auth', require('../modules/auth/auth_item.router'));
router.use('/upload', require('../modules/upload/upload.router'));
router.use('/blog-categories', require('../modules/blog_category/blog_category.router'));
router.use('/clinic-reasons', require('../modules/clinic_reason/clinic_reason.router'));
router.use('/blog-public', require('../modules/blog_public/blog_public.router'));

// Bệnh nhân (carenow-client) — Google login + hồ sơ
router.use('/auth/client', require('../modules/patient/auth_client.router'));
router.use('/patient', require('../modules/patient/patient.router'));

// Lịch hẹn khám bệnh (public booking + patient view + admin manage)
router.use('/appointments', require('../modules/appointment/appointment.router'));

// Liên hệ hợp tác (Partner Contact)
router.use('/partner-contacts', require('../modules/partner_contact/partner_contact.router'));

// Tư vấn thêm (Consultation Requests)
router.use('/consultations', require('../modules/consultation/consultation.router'));

// Cài đặt hệ thống (Settings)
router.use('/settings', require('../modules/settings/settings.router'));

// Dashboard thống kê
router.use('/dashboard', require('../modules/dashboard/dashboard.router'));

module.exports = router;
