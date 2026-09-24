import React, { useContext, useEffect } from "react";
import { socketContext } from "../context/Socket_context";
import { useParams } from "react-router-dom";

function Room (){
    const {socket} = useContext(socketContext);
    const {roomCode} = useParams();

    useEffect(() => {
    if (!socket) return;

    socket.emit("room-join", roomCode);
}, [socket, roomCode]);
    return(
        <>
        <h1>Room entered</h1>
        </>
    )
}
export default Room;
