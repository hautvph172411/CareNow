const express = require('express');
const router = express.Router();
const controller = require('./auth_item.controller');

router.get('/items', controller.getItems);
router.post('/items', controller.createItem);
router.get('/items/:name/children', controller.getItemChildren);
router.post('/items/:name/children', controller.setItemChildren);

router.post('/assign', controller.assignToUser);
router.get('/assignments/:userId', controller.getUserPermissions);

module.exports = router;
