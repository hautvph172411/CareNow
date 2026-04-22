const express = require('express');
const router = express.Router();
const controller = require('./user.controller');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/role');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/', auth, controller.createUser);
router.get('/', auth, roleCheck(1), controller.getUsers);
router.get('/:id', auth, controller.getUserById);
router.delete("/:id", auth, controller.deleteUser);
router.put("/:id", auth, controller.updateUser);

module.exports = router;

