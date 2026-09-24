import React, { useEffect , useState } from "react";
import {io} from 'socket.io-client';
import axios from 'axios'
import {useNavigate} from 'react-router-dom'

function Home(){
    const navigate = useNavigate();
    const [roomId , setRoomId] = useState('');

    const newRoom =async ()=>{
        const token = localStorage.getItem('token');
        const res = await axios.post('http://localhost:4000/api/rooms' ,{}, {
            headers:{
                'Authorization' : `Bearer ${token}`
            }
        })

        const {roomCode } = res.data;
        
        navigate(`/room/${roomCode}`);
    }   

    const JoinRoom = async()=>{
        try{
        const token = localStorage.getItem('token');
        console.log(roomId);
        const res = await axios.post('http://localhost:4000/api/rooms/join' , {roomCode:roomId} , {
            headers:{
                'Authorization' : `Bearer ${token}`
            }
        })
        if(res.data.success === true){
            navigate(`/room/${roomId}`);
        }
    }catch(err){
        console.log(err);
        console.log("DATA:", err.response?.data);
        console.log("MESSAGE:", err.response?.data?.message);
    }
    }

    return(
        <>
        <button onClick={newRoom}>Create room</button>
        <input placeholder="enter roomID" required value={roomId} onChange={(e)=>setRoomId(e.target.value)}></input>
        <button onClick={JoinRoom}>Join Room</button>
        </>
    )
}
export default Home;