const express = require('express');
const router_room = express.Router();
const {auth} = require('../middleware/auth');
const { CreateRoom, JoinRoom, FindThisRoom, DeleteRoom, GetRooms, LeaveRoom, GetMessages, GetMe, GetStats } = require('../middleware/room_middle');


router_room.route('/rooms/:roomCode').get(auth ,FindThisRoom)
router_room.route('/rooms').post(auth , CreateRoom).get(auth , GetRooms);
router_room.route('/rooms/join').post(auth , JoinRoom)
router_room.route('/rooms/delete/:roomCode').delete(auth ,DeleteRoom);
router_room.route('/rooms/leave/:roomCode').post(auth , LeaveRoom);
router_room.route('/rooms/messages/:roomCode').get(auth , GetMessages);
router_room.route('/users/me').get(auth , GetMe);
router_room.route('/users/me/stats').get(auth , GetStats);
module.exports = router_room;