const Room = require('../models/room_model');
const User = require('../models/users_model');
const Chat = require('../models/room_chat_model');
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
let hasPass = false;
    if(req.body.password){ newPass = await bcrypt.hash(req.body.password , 10); hasPass=true}
    
     await Room.create({roomCode:roomCode ,password: newPass , leader:user_id , members:[user_id] , title:req.body.title , description: req.body.description ,hasPassword: hasPass , membersLimit:req.body.membersLimit }  );
    await User.updateOne({ _id: user_id }, { $inc: { roomsCreated: 1 } });
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
    const limit = temp_room.membersLimit;
    const members = temp_room.members;
    if(members.length >= limit){return res.json({success:false , message:"Room is already full" })}
    if(temp_room.password){
    const test = await bcrypt.compare(password , temp_room.password)
    if( !test){
        return res.status(401).json({success:false , message : "invalid password"});
    }
    }
    await Room.updateOne({roomCode : roomCode } , {$push : {members : user_id}});
    await User.updateOne({ _id: user_id }, { $inc: { roomsJoined : 1 } });

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
        await  Chat.deleteMany({room : room._id})
        return res.send("room and chat deleted");
    }
    return res.status(500).send("room was not deleted");

}



const GetRooms = async (req,res)=>{
    const rooms = await Room.find({}).select("-password").populate("leader","username").populate("members" , "username");
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



const CreateMessage = async (message, roomCode, user_id)=>{
    

    const room = await Room.findOne({roomCode : roomCode});
    if(!room){
        throw new Error("room not found");
    }
    const user = room.members.find(m=> m.toString() === user_id );
    if(!user){
        throw new Error("User Not in the room");
    }
    
    const chat = await Chat.create({message:message , sender:user_id , room:room._id });
    await User.updateOne({ _id: user_id }, { $inc: { totalMessages: 1 } });
    return chat;

}


const GetMessages = async(req,res)=>{
    const {user_id} = req.user;
    const roomCode = req.params.roomCode;
    const room = await Room.findOne({roomCode : roomCode});
    if(!room){
        throw new Error("room not found");
    }
    const user = room.members.find(m=> m.toString() === user_id );
    if(!user){
        throw new Error("User Not in the room");
    }

    const roomId = room._id;
    const chat = await Chat.find({room : roomId}).populate("sender", "username").sort({ time: 1 });

    res.json({success:true , message : chat});
}



const GetMe = async (req,res)=>{
    const {username , user_id} = req.user;
    const user = await User.findOne({_id : user_id});
    if(!user){
        throw new Error("user not found");
    }
    res.json({success: true , username:user.username , timestamp:user.createdAt})
}


const GetStats = async (req,res)=>{
    const {username , user_id} = req.user;
    const user = await  User.findOne({_id:user_id});
    if(!user){
        throw new Error("user not found");
    }
    res.json({success: true , roomsCreated:user.roomsCreated , roomsJoined:user.roomsJoined , totalMessages:user.totalMessages})
}
module.exports = {CreateRoom , JoinRoom , FindThisRoom , DeleteRoom , GetRooms , LeaveRoom , CreateMessage , GetMessages , GetMe , GetStats};