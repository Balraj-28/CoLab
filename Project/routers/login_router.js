const express = require('express');
const router = express.Router();
const {auth} = require('../middleware/auth');
const {LoginCheck, Register, Logout} = require('../middleware/login_middle');
router.route('/login').post(LoginCheck);
router.route('/register').post(Register);
router.route('/logout').post(Logout);



module.exports = router;
