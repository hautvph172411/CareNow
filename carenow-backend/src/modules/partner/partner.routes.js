const express = require('express');
const router = express.Router();
const partnerController = require('./partner.controller');

router.get('/', partnerController.getPartners);
router.get('/:id', partnerController.getPartnerById);
router.post('/', partnerController.createPartner);
router.put('/:id', partnerController.updatePartner);
router.delete('/:id', partnerController.deletePartner);

module.exports = router;
