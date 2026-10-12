const express = require('express');
require('dotenv').config();
const { Server } = require('socket.io');
const cors = require('cors');
const app = express();

app.use(express.json());

const connectDB = require('./db-connect/connect');
app.use(cors());

const router_room = require('./routers/room_router');
const jwt = require('jsonwebtoken');
const router = require('./routers/login_router');

app.use('/api', router);
app.use('/api', router_room);

const { createServer } = require('http');

const { CreateMessage } = require('./middleware/room_middle');
const Room = require('./models/room_model');

const OurServer = createServer(app);

const io = new Server(OurServer, {
    cors: {
        origin: true
    }
});

app.set("io", io);

io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error("Authentication token missing"));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SIGN);
        socket.user = decoded;
        next();
    }
    catch (err) {
        return next(new Error("Invalid Token"));
    }
});


io.on("connection", (socket) => {

    const socket_id = socket.id;
    const socket_name = socket.user.username;

    console.log(`${socket_name} joined with id ${socket_id}`);


    // ---------------- DISCONNECT ----------------

    socket.on("disconnect", (reason) => {

        const roomCode = socket.currentRoom;

        if (roomCode) {
            socket.to(roomCode).emit(
                "user-left",
                socket.user.username
            );
        }

        console.log(
            `${socket_name} disconnected with id ${socket_id}`
        );

        console.log("Reason:", reason);
    });


    // ---------------- JOIN ROOM ----------------

    socket.on("room-join", async (roomCode) => {

        const room = await Room.findOne({
            roomCode: roomCode
        });

        if (
            !room.members.find(
                (m) => m.toString() === socket.user.user_id
            )
        ) {
            return socket.emit(
                "room-join-failed",
                "not allowed in this room"
            );
        }

        socket.join(roomCode);

        socket.currentRoom = roomCode;

        socket.to(roomCode).emit(
            "room-joined",
            socket_name
        );

        console.log(
            `${socket.user.username} has joined room ${roomCode}`
        );
    });


    // ---------------- CHAT ----------------

    socket.on("message", async (message, roomCode) => {

        if (!message || !message.trim()) return;

        if (socket.rooms.has(roomCode)) {

            try {

                console.log(
                    "message recieved : ",
                    message
                );

                await CreateMessage(
                    message,
                    roomCode,
                    socket.user.user_id
                );

                io.to(roomCode).emit(
                    "message",
                    message,
                    socket.user.username
                );

            }
            catch (err) {

                socket.emit(
                    "message-failed",
                    "Could not send message, try again"
                );

                console.log(err);
            }
        }
    });


    // ---------------- DRAWING ----------------

    socket.on(
        "draw",
        ({ strokeId, points, roomCode, color }) => {

            if (!socket.rooms.has(roomCode)) return;

            socket.to(roomCode).emit(
                "draw",
                {
                    strokeId: strokeId,
                    points: points,
                    color: color
                }
            );
        }
    );


    // ---------------- DRAWING PRESENCE ----------------

    socket.on(
        "user-started-drawing",
        (roomCode) => {

            if (!socket.rooms.has(roomCode)) return;

            socket.to(roomCode).emit(
                "user-started-drawing",
                {
                    username: socket.user.username
                }
            );
        }
    );


    socket.on(
        "user-stopped-drawing",
        (roomCode) => {

            if (!socket.rooms.has(roomCode)) return;

            socket.to(roomCode).emit(
                "user-stopped-drawing",
                {
                    username: socket.user.username
                }
            );
        }
    );


    // ---------------- TYPING PRESENCE ----------------

    socket.on(
        "user-started-typing",
        (roomCode) => {

            if (!socket.rooms.has(roomCode)) return;

            socket.to(roomCode).emit(
                "user-started-typing",
                {
                    username: socket.user.username
                }
            );
        }
    );


    socket.on(
        "user-stopped-typing",
        (roomCode) => {

            if (!socket.rooms.has(roomCode)) return;

            socket.to(roomCode).emit(
                "user-stopped-typing",
                {
                    username: socket.user.username
                }
            );
        }
    );

});


const start = async () => {

    try {

        await connectDB(process.env.MONGO_URI);

        console.log("database connected");

        OurServer.listen(
            4000,
            '0.0.0.0',
            () => {
                console.log("server online");
            }
        );

    }
    catch (err) {

        console.log(err);

    }

};

start();