const express = require('express');
const router_room = express.Router();
const {auth} = require('../middleware/auth');
const { CreateRoom } = require('../middleware/room_middle');

router_room.route('/rooms').post(auth , CreateRoom)

module.exports = router_room;