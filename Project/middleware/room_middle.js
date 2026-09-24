const Room = require('../models/room_model');


const CreateRoom = async (req,res)=>{
    const {username , user_id} = req.user;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    let roomCode;

    while (true) {
        roomCode = "";

    for (let i = 0; i < 4; i++) {
        roomCode += chars[Math.floor(Math.random() * chars.length)];
    }

    const existingRoom = await Room.findOne({ roomCode });

    if (!existingRoom) {
        break;
    }
}

     await Room.create({roomCode:roomCode , leader:user_id , members:[user_id]  });

    res.json({success:true , roomCode:roomCode , leader:username});
}



module.exports = {CreateRoom};