import React, { useEffect } from "react";
import {io} from 'socket.io-client';
import axios from 'axios'
import {useNavigate} from 'react-router-dom'

function Home(){
    const navigate = useNavigate();
    

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

    return(
        <>
        <button onClick={newRoom}>Create room</button>
        </>
    )
}
export default Home;