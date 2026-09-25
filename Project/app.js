const express = require('express');
require('dotenv').config();
const {Server} = require('socket.io')
const cors = require('cors');
const app = express();
app.use(express.json());
const connectDB = require('./db-connect/connect');
app.use(cors());
const router_room = require('./routers/room_router');
const jwt = require('jsonwebtoken')
const router = require('./routers/login_router');
app.use('/' , router);
app.use('/api' , router_room);
const {createServer} = require('http');


const OurServer = createServer(app);

const io = new Server(OurServer , {
    cors : {
        origin : "http://localhost:5173"
    }
})


app.set("io" , io);
io.use((socket , next)=>{
    const token = socket.handshake.auth.token;
    if(!token){
        return next(new Error("Authentication token missing"));
    }

    try{
        const decoded = jwt.verify(token , process.env.JWT_SIGN);
        socket.user = decoded;
        next();
    }
    catch(err){
        return next(new Error("Invalid Token"));
    }
    
})
 
io.on("connection" , (socket)=>{
    const socket_id = socket.id;
    const socket_name = socket.user.username;
    console.log(`${socket_name} joined with id ${socket_id}`);

    socket.on("disconnect", (reason) => {
        const roomCode = socket.currentRoom;

        if (roomCode) {
        socket.to(roomCode).emit("user-left", socket.user.username);
        }

    console.log(`${socket_name} disconnected with id ${socket_id}`);
    console.log("Reason:", reason);
    });

    socket.on('room-join' , (roomCode)=>{
        socket.join(roomCode);
        socket.to(roomCode).emit('room-joined' , socket_name);
        socket.currentRoom = roomCode;
        console.log(`${socket.user.username } has joined room ${roomCode}`);
    })

    socket.on("message" , (message , roomCode)=>{if (socket.rooms.has(roomCode)) {
        console.log("message received : "  , message)
    socket.to(roomCode).emit("message", message);
} });
})



const start  = async ()=>{
    try{
    await connectDB(process.env.MONGO_URI); 
    console.log("database connected");
    OurServer.listen(4000 , ()=>{
    console.log("server online");
    }
)  
} catch(err){
    console.log(err);
}

}

start();