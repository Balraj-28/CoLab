import React, { useContext, useEffect, useState } from "react";
import { socketContext } from "../context/Socket_context";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function Room (){
    const {socket} = useContext(socketContext);
    const {roomCode} = useParams();
    const [msg , setMsg] = useState('');
    const [roomExist , setRoomExist] = useState(false);
    const [chat, setChat] = useState([]);
    const [leader , setLeader] = useState('');
    const [members , setMembers] = useState([]);
    const [currentUser , setCurrentUser] = useState('');
    const [lastAttempted , setLastAttempted] = useState('');
    const navigate = useNavigate();
useEffect(() => {
    const checkRoom = async () => {
        try {
            const reply = await axios.get(`http://localhost:4000/api/rooms/${roomCode}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

            if (reply.data.success) {
                setRoomExist(true);
                setLeader(reply.data.room.leader.username);
                setCurrentUser(reply.data.currentUser)
                setMembers(reply.data.room.members.map(val=>val.username))
                console.log(reply.data.currentUser);
                console.log(reply.data.room.leader);
                
            } else {
                setRoomExist(false);
            }
        } catch (err) {
            setRoomExist(false);
        }
    };

    checkRoom();
}, [roomCode]);

useEffect(()=>{
    if (!socket || !roomExist) return;

    const getMessage = async ()=>{

        try{
        const chat = await axios.get(`http://localhost:4000/api/rooms/messages/${roomCode}` , {
            headers:{
                'Authorization' : `Bearer ${localStorage.getItem('token')}`
            }
        })
    
        const temp = chat.data.message.map((obj)=> `${obj.sender.username} : ${obj.message}`);
        setChat(temp);
    }
    catch(err){
        console.log(err)
    }


    }
    getMessage();
},[roomCode , roomExist , socket])

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
    const handleMessage = (message , username) => {
        setChat(prev => [...prev, `${username} : ${message}`]);
    };
    const handleUserLeft = (username) => {
    setMembers(prev => prev.filter(member => member !== username));
    };
    
    const handleRoomDelete = ()=>{
        navigate('/home' , {replace:true});
    }
    const LeaderChanged = (username)=>{
        setLeader(username);
    }
    const handleMessagefailed = (err)=>{
        alert(err);
        setMsg(lastAttempted);
    }    

    socket.on("connect", joinRoom);
    socket.on("message", handleMessage);
    socket.on("room-joined", handleRoomJoined);
    socket.on('user-left' , handleUserLeft);
    socket.on('room-deleted' , handleRoomDelete);
    socket.on('leader-changed' , LeaderChanged);
    socket.on('message-failed' , handleMessagefailed);
    if (socket.connected) {
        joinRoom();
    }

    return () => {
        socket.off("leader-changed" , LeaderChanged);
        socket.off("user-left" , handleUserLeft);
        socket.off("connect", joinRoom);
        socket.off("message", handleMessage);
        socket.off("room-joined" , handleRoomJoined);
         socket.off('room-deleted' , handleRoomDelete);
         socket.off('message-failed', handleMessagefailed);
    };

}, [socket, roomCode, roomExist]);

    

    const Send = ()=>{
    
    if (!msg.trim()) return;
    socket.emit("message", msg, roomCode);

    console.log("MESSAGE EMITTED");
    setLastAttempted(msg);
    setMsg("");
        
    }

    const sendDelete = async ()=>{
        try{
        await axios.delete(`http://localhost:4000/api/rooms/delete/${roomCode}` , {
            headers:{
                 Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });
        }
        catch(err){
            console.log(err);
        }
    }

    const Leave = async()=>{
        try{
            const res = await axios.post(`http://localhost:4000/api/rooms/leave/${roomCode}` , {} , {
                headers:{
                    Authorization : `Bearer ${localStorage.getItem('token')}`
                }
            })
            navigate('/home' , {replace:true});
        }
        catch(err){
            console.log(err.response)
        }
    }
    return(
        <>
        {roomExist? <><h1>Room {roomCode} entered</h1>
        <input placeholder="enter message" value={msg} onChange={(e)=>setMsg(e.target.value) } required></input>
        <button onClick={Send} disabled={!socket}>Send</button>
        {leader === currentUser?<button onClick ={sendDelete}>Delete Room</button> : <></>}
        <button onClick={Leave}>Leave</button>
        <div> Leader : {leader}</div>
        <div> You : {currentUser}</div>
        <div>Members</div>
         {members.map((value,index)=><div key={index}>{value}</div>)}
         <div >Chat</div>
        {chat.map((value , index)=> <div key={index}>{value}</div>)} 
        
       
        </> : <h1>Room Does Not exist</h1>}

        
        </>
    )
}
export default Room;
