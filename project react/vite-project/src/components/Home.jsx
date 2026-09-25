import React, { useEffect, useState } from "react";
import { io } from 'socket.io-client';
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import './Home.css';
function Home() {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('');
    const [rooms, setRooms] = useState([]);
    const [password, setPassword] = useState("");
    const [key, setKey] = useState("");
    const newRoom = async () => {
        const token = localStorage.getItem('token');
        const res = await axios.post('http://localhost:4000/api/rooms', { "password": password }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        setPassword("");
        const { roomCode } = res.data;

        navigate(`/room/${roomCode}`);
    }

    const JoinRoom = async (roomId) => {
        try {
            const token = localStorage.getItem('token');
            console.log(roomId);
            const res = await axios.post('http://localhost:4000/api/rooms/join', { roomCode: roomId, password: key }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (res.data.success === true) {
                navigate(`/room/${roomId}`);
                setKey("");
            }
        } catch (err) {
            console.log(err);
            console.log("DATA:", err.response?.data);
            console.log("MESSAGE:", err.response?.data?.message);
        }
    }

    const GetRooms = async () => {
        const res = await axios.get('http://localhost:4000/api/rooms', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        setRooms(res.data);
    }

    useEffect(() => {
        try {
            GetRooms();
        }
        catch (err) {
            console.log(err.response);
        }
    }, [])

    return (
        <>
            <label htmlFor="pass">Password</label>
            <input placeholder="Optional" id="pass" value={password} onChange={(e) => {
                const value = e.target.value; if (/^[A-Za-z]*$/.test(value)) {
                    setPassword(value);
                }
            }}
                maxLength={6} className="input-pass"></input>

            <button onClick={newRoom} className="btn">Create room</button>
            <input placeholder="enter roomID" required value={roomId} onChange={(e) => setRoomId(e.target.value)} className="input-id"></input>
            <input placeholder="enter password" maxLength={6} value={key} onChange={(e) => setKey(e.target.value)} className="input-key"></input>
            <button onClick={() => JoinRoom(roomId)} className="btn">Join Room</button>
            <button onClick={() => GetRooms()} className="btn">refresh</button>
            {rooms.map((value, index) => {
                return (
                    <div key={index} className="rooms">{value.leader.username}'s Room Code:{value.roomCode} <button onClick={() => { JoinRoom(value.roomCode) }}>Join</button></div>
                )
            })}
        </>
    )
}
export default Home;