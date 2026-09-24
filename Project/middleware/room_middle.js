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

const JoinRoom = async (req ,res)=>{
    const {username , user_id} = req.user;
    const {roomCode} = req.body;

    const temp_room = await Room.findOne({roomCode : roomCode});
    if(!temp_room){
        return res.status(409).json({success:false , message : "room does not exist"});
    }
    const already_in = temp_room.members.find(
    member => member.toString() === user_id
);
    if(already_in){
        return res.status(409).json({success:false , message : "user already in room"});
    }
    
    await Room.updateOne({roomCode : roomCode } , {$push : {members : user_id}});
    res.json({success:true , message:"added successfully"});
}

module.exports = {CreateRoom , JoinRoom};