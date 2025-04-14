const express = require('express');
const { login, register, refreshUserToken, logout } = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refreshUserToken);
router.post('/logout', logout);

module.exports = router;