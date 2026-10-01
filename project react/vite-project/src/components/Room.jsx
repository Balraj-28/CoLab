import React, { useContext, useEffect, useState } from "react";
import { socketContext } from "../context/Socket_context";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useRef } from "react";

function Room() {
    const { socket } = useContext(socketContext);
    const { roomCode } = useParams();
    const [msg, setMsg] = useState('');
    const [roomExist, setRoomExist] = useState(false);
    const [chat, setChat] = useState([]);
    const [leader, setLeader] = useState('');
    const [members, setMembers] = useState([]);
    const [currentUser, setCurrentUser] = useState('');
    const [lastAttempted, setLastAttempted] = useState('');
    const [error, SetError] = useState('');
    const navigate = useNavigate();
    useEffect(() => {
        const checkRoom = async () => {
            try {
                const reply = await axios.get(`/api/rooms/${roomCode}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });

                if (reply.data.success) {
                    setRoomExist(true);
                    setLeader(reply.data.room.leader.username);
                    setCurrentUser(reply.data.currentUser)
                    setMembers(reply.data.room.members.map(val => val.username))
                    console.log(reply.data.currentUser);
                    console.log(reply.data.room.leader);

                } else {
                    setRoomExist(false);
                }
            } catch (err) {
                setRoomExist(false);
                SetError(err.response?.data?.message);
            }
        };

        checkRoom();
    }, [roomCode]);

    useEffect(() => {
        if (!socket || !roomExist) return;

        const getMessage = async () => {

            try {
                const chat = await axios.get(`/api/rooms/messages/${roomCode}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })

                const temp = chat.data.message.map((obj) => `${obj.sender.username} : ${obj.message}`);
                setChat(temp);
            }
            catch (err) {
                console.log(err)
            }


        }
        getMessage();
    }, [roomCode, roomExist, socket])

    useEffect(() => {
        if (!socket || !roomExist) return;

        const joinRoom = () => {
            socket.emit("room-join", roomCode);
        };
        const handleRoomJoined = (socketName) => {
            setMembers(prev => {
                if (prev.includes(socketName)) {
                    return prev;
                }

                return [...prev, socketName];
            });
        };
        const handleMessage = (message, username) => {
            setChat(prev => [...prev, `${username} : ${message}`]);
        };
        const handleUserLeft = (username) => {
            setMembers(prev => prev.filter(member => member !== username));
        };

        const handleRoomDelete = () => {
            navigate('/home', { replace: true });
        }
        const LeaderChanged = (username) => {
            setLeader(username);
        }
        const handleMessagefailed = (err) => {
            alert(err);
            setMsg(lastAttempted);
        }

        socket.on("connect", joinRoom);
        socket.on("message", handleMessage);
        socket.on("room-joined", handleRoomJoined);
        socket.on('user-left', handleUserLeft);
        socket.on('room-deleted', handleRoomDelete);
        socket.on('leader-changed', LeaderChanged);
        socket.on('message-failed', handleMessagefailed);
        if (socket.connected) {
            joinRoom();
        }

        return () => {
            socket.off("leader-changed", LeaderChanged);
            socket.off("user-left", handleUserLeft);
            socket.off("connect", joinRoom);
            socket.off("message", handleMessage);
            socket.off("room-joined", handleRoomJoined);
            socket.off('room-deleted', handleRoomDelete);
            socket.off('message-failed', handleMessagefailed);
        };

    }, [socket, roomCode, roomExist]);


    const boardRef = useRef(null);
    useEffect(() => {

        if (!roomExist || !socket) return;
        const board = boardRef.current;
        const ctx = board.getContext("2d");

        let buffer = [];
        let rafId = null;
        let strokeId = null;

        const loop = () => {
            if (buffer.length > 0) {
                socket.emit('draw', {
                    strokeId: strokeId,
                    points: buffer.map((p) => ({ x: p.x / board.width, y: p.y / board.height })),
                    roomCode: roomCode
                })
                buffer = [];
            }
            if (isDrawing) {
                rafId = requestAnimationFrame(loop);
            }
        }

        const incomingStrokeId = {};
        const handleIncoming = ({ strokeId, points, roomCode: incomingRoomCode }) => {
            const scaledPoints = points.map(p => ({ x: p.x * board.width, y: p.y * board.height }));
            let prev = incomingStrokeId[strokeId];

            for (const p of scaledPoints) {
                if (prev) {
                    ctx.beginPath();
                    ctx.moveTo(prev.x, prev.y);
                    ctx.lineTo(p.x, p.y);
                    ctx.stroke();
                }
                prev = p;
            }
            incomingStrokeId[strokeId] = prev;
        };

        socket.on('draw', handleIncoming);

        const getMousePos = (e) => {
            const rect = board.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (board.width / rect.width);
            const y = (e.clientY - rect.top) * (board.height / rect.height);
            return ({ x: x, y: y });
        }
        let lastX;
        let lastY;
        let isDrawing = false;
        const handlePointerDown = (e) => {
            const pos = getMousePos(e);
            strokeId = `${socket.id}-${Date.now()}`
            lastX = pos.x;
            lastY = pos.y;
            isDrawing = true;
            buffer = [pos];
            loop();
        };

        const handlePointerMove = (e) => {
            if (!isDrawing) return;

            const pos = getMousePos(e);

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();

            lastX = pos.x;
            lastY = pos.y;
            buffer = [...buffer, pos]
        };

        const handlePointerUp = () => {
            isDrawing = false;
        };
        board.addEventListener("pointerdown", handlePointerDown);
        board.addEventListener("pointermove", handlePointerMove);
        document.addEventListener("pointerup", handlePointerUp);

        return () => {
            board.removeEventListener("pointerdown", handlePointerDown);
            board.removeEventListener("pointermove", handlePointerMove);
            document.removeEventListener("pointerup", handlePointerUp);
            socket.off('draw', handleIncoming);
        };
    }, [roomExist , socket])



    const Send = () => {

        if (!msg.trim()) return;
        socket.emit("message", msg, roomCode);

        console.log("MESSAGE EMITTED");
        setLastAttempted(msg);
        setMsg("");

    }

    const sendDelete = async () => {
        try {
            await axios.delete(`/api/rooms/delete/${roomCode}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
        }
        catch (err) {
            console.log(err);
        }
    }

    const Leave = async () => {
        try {
            const res = await axios.post(`/api/rooms/leave/${roomCode}`, {}, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })
            navigate('/home', { replace: true });
        }
        catch (err) {
            console.log(err.response)
        }
    }
    return (
        <>
            {roomExist ? <><h1>Room {roomCode} entered</h1>
                <input placeholder="enter message" value={msg} onChange={(e) => setMsg(e.target.value)} required></input>
                <button onClick={Send} disabled={!socket}>Send</button>
                {leader === currentUser ? <button onClick={sendDelete}>Delete Room</button> : <></>}
                <button onClick={Leave}>Leave</button>
                <div> Leader : {leader}</div>
                <div> You : {currentUser}</div>
                <div>Members</div>
                {members.map((value, index) => <div key={index}>{value}</div>)}
                <div >Chat</div>
                {chat.map((value, index) => <div key={index}>{value}</div>)}

                <canvas height={600} width={600} ref={boardRef} style={{ border: "1px solid black", margin: "10px" , touchAction: "none" }}></canvas>
            </> : <h1>{error}</h1>}


        </>
    )
}
export default Room;
