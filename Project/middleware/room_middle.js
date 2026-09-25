const Room = require('../models/room_model');
const User = require('../models/users_model');
const bcrypt = require('bcrypt')
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
const password = req.body.password || "";
if (!/^[A-Za-z]{0,6}$/.test(password)) {
    return res.status(400).json({
        success: false,
        message: "Password must contain only letters and be at most 6 characters"
    });
}
let newPass = "";
    if(req.body.password){ newPass = await bcrypt.hash(req.body.password , 10);}
    
     await Room.create({roomCode:roomCode ,password: newPass , leader:user_id , members:[user_id]  });

    res.json({success:true , roomCode:roomCode , leader:username});
}

const JoinRoom = async (req ,res)=>{
    const {username , user_id} = req.user;
    const {roomCode , password=""} = req.body;

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
    if(temp_room.password){
    const test = await bcrypt.compare(password , temp_room.password)
    if( !test){
        return res.status(401).json({success:false , message : "invalid password"});
    }
    }
    await Room.updateOne({roomCode : roomCode } , {$push : {members : user_id}});
    res.json({success:true , message:"added successfully"});
}



const FindThisRoom = async(req,res)=>{
    const roomCode = req.params.roomCode;
    const currentUser = req.user.username;
    if(!roomCode){
        return res.status(400).json({success:false , message : "room does not exist"});
    }
    const room = await Room.findOne({ roomCode })
    .populate("leader", "username")
    .populate("members", "username");
    if(!room){
        return res.status(400).json({success:false , message : "room does not exist"});
    }
    return res.json({success:true , message:"room found" , room  , currentUser });
}


const DeleteRoom = async (req,res)=>{
    const roomCode = req.params.roomCode;
    
    if(!roomCode){
        return res.status(400).json({success:false , message : "room does not exist"});
    }
    const room = await Room.findOne({ roomCode })
    .populate("leader", "_id")

    if(!room){
        return res.status(400).json({success:false , message : "room does not exist"});
    }

    if(req.user.user_id !== room.leader._id.toString()){
        return res.status(403).send("unauthorized action");
    }
    const temp = await Room.deleteOne({roomCode : roomCode});
    if(temp.deletedCount === 1){
        const io = req.app.get("io");
        io.to(roomCode).emit("room-deleted");
        return res.send("room deleted");
    }
    return res.status(500).send("room was not deleted");

}



const GetRooms = async (req,res)=>{
    const rooms = await Room.find({}).select("-password").populate("leader","username");
    res.send(rooms);
}


const LeaveRoom = async (req,res)=>{
    const roomCode = req.params.roomCode;
    const user_id = req.user.user_id;
    const username = req.user.username;
    const room = await Room.findOne({roomCode : roomCode});
     if (!room) throw new NotFoundError('Room not found');

    const temp = room.members.find((m)=>m.toString() === user_id)
    if(!temp){
        return res.status(401).send("not in the room")
    }

    const leader = room.leader;
    if(leader.toString() === user_id && room.members.length === 1){
        await Room.deleteOne({roomCode : roomCode});
        return res.json({success : true , message : "room deleted successfully"});
    }
    let new_leader;
    if(leader.toString() === user_id){
         new_leader = room.members.find((m)=> m.toString() !== user_id);
        room.leader = new_leader; 
    }

    room.members = room.members.filter((m)=>m.toString() !==user_id);
    await room.save();

    const io = req.app.get('io');
    io.to(roomCode).emit('user-left' , username);
    
    if (new_leader) {
    const newLeaderUser = await User.findById(new_leader).select('username');
    io.to(roomCode).emit('leader-changed', newLeaderUser.username);
}
    return res.send("leaved successfully");
}
module.exports = {CreateRoom , JoinRoom , FindThisRoom , DeleteRoom , GetRooms , LeaveRoom};