const express = require('express');
const router_room = express.Router();
const {auth} = require('../middleware/auth');
const { CreateRoom, JoinRoom } = require('../middleware/room_middle');

router_room.route('/rooms').post(auth , CreateRoom)
router_room.route('/rooms/join').post(auth , JoinRoom)
module.exports = router_room;