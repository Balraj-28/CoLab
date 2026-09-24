import React, { useContext, useEffect, useState } from "react";
import { socketContext } from "../context/Socket_context";
import { useParams } from "react-router-dom";

function Room (){
    const {socket} = useContext(socketContext);
    const {roomCode} = useParams();
    const [msg , setMsg] = useState('');

    const [chat, setChat] = useState([]);
    useEffect(() => {
    if (!socket) return;

    const joinRoom = () => {
        socket.emit("room-join", roomCode);
    };


    socket.on("connect", joinRoom);

   
    if (socket.connected) {
        joinRoom();
    }

    const handleMessage = (message) => setChat(prev => [...prev, message]);
    socket.on("message", handleMessage);

    return () => {
        socket.off("connect", joinRoom);
        socket.off("message", handleMessage);
    };
}, [socket, roomCode]);

    

    const Send = ()=>{
    console.log("SOCKET:", socket);
    console.log("MESSAGE:", msg);
    console.log("ROOM:", roomCode);

    if (!socket) {
        console.log("NO SOCKET");
        return;
    }

    socket.emit("message", msg, roomCode);

    console.log("MESSAGE EMITTED");

    setMsg("");
        
    }
    return(
        <>
        <h1>Room entered</h1>
        <input placeholder="enter message" value={msg} onChange={(e)=>setMsg(e.target.value) } required></input>
        <button onClick={Send} disabled={!socket}>Send</button>
        {chat.map((value , index)=> <div key={index}>{value}</div>)}
        </>
    )
}
export default Room;
