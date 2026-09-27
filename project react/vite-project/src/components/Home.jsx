import React, { useEffect, useState } from "react";
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import NetworkBackground from "./NetworkBackground";

function Home() {
    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
    }
   
    const [roomId, setRoomId] = useState('');
    const [rooms, setRooms] = useState([]);
    const [password, setPassword] = useState("");
    const [key, setKey] = useState("");


    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [membersLimit, setMembersLimit] = useState(8);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [showJoinModal, setShowJoinModal] = useState(false);
    const [pendingRoomCode, setPendingRoomCode] = useState(null);

    const [me, setMe] = useState(null);
    const [stats, setStats] = useState(null);
    const [recents, setRecents] = useState([]);

  
    const newRoom = async () => {
        const token = localStorage.getItem('token');
        const res = await axios.post('http://localhost:4000/api/rooms', {
            password: password,
            title: title || "Untitled room",
            description: description,
            membersLimit: membersLimit
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setPassword("");
        setTitle("");
        setDescription("");
        setMembersLimit(8);
        setShowCreateModal(false);
        const { roomCode } = res.data;
        navigate(`/room/${roomCode}`);
    }


    const JoinRoom = async (roomId) => {
        try {
            const token = localStorage.getItem('token');
            console.log(roomId);
            const res = await axios.post('http://localhost:4000/api/rooms/join', { roomCode: roomId, password: key }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.data.success === true) {
                navigate(`/room/${roomId}`);
                setKey("");
            }
        } catch (err) {
            console.log(err);
            console.log("DATA:", err.response?.data);
            console.log("MESSAGE:", err.response?.data?.message);
            throw err;
        }
    }


    const attemptJoin = async (code, knownHasPassword = null) => {
        setPendingRoomCode(code);

        if (knownHasPassword === true) {
            setShowJoinModal(true);
            return;
        }
        if (knownHasPassword === false) {
            await JoinRoom(code);
            return;
        }

        try {
            await JoinRoom(code);
        } catch (err) {
            if (err.response?.data?.message === "invalid password") {
                setShowJoinModal(true);
            } else {
                alert(err.response?.data?.message || "Could not join room");
            }
        }
    }

    const confirmJoinFromModal = async () => {
        await JoinRoom(pendingRoomCode);
        setShowJoinModal(false);
        setPendingRoomCode(null);
    }


    const GetRooms = async () => {
        const res = await axios.get('http://localhost:4000/api/rooms', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const sorted = [...res.data].sort((a, b) => b.members.length - a.members.length);
        setRooms(sorted);
    }

    
    const GetMe = async () => {
        const res = await axios.get('http://localhost:4000/api/users/me', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setMe(res.data);
    }

    const GetStats = async () => {
        const res = await axios.get('http://localhost:4000/api/users/me/stats', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setStats(res.data);
    }

    const GetRecents = async () => {
        const res = await axios.get('http://localhost:4000/api/rooms/recents', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setRecents(res.data.message);
    }

    useEffect(() => {
        try {
            GetRooms();
            GetMe();
            GetStats();
            GetRecents();
        }
        catch (err) {
            console.log(err.response);
        }
    }, [])

   
    const palette = ['#7C6FF0', '#2FBF9F', '#FF6B35', '#3B9EFF'];
    const colorForCode = (code) => {
        let hash = 0;
        for (let i = 0; i < code.length; i++) hash += code.charCodeAt(i);
        return palette[hash % palette.length];
    }
    const initials = (username) => username?.[0]?.toUpperCase() || '?';

    return (
        <div className="min-h-screen bg-[#E3E6ED] font-[Outfit,sans-serif]">
            <NetworkBackground />
            <div className="fixed inset-0 z-0 bg-[#E3E6ED]/55 pointer-events-none"></div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 md:py-10">

                <div className="flex items-center justify-between mb-8">
                    <span className="text-base tracking-[0.25em] font-light text-[#1A1A2E]">
                        C<span className="font-extralight">o</span>L<span className="font-extralight">a</span>b
                    </span>
                    <div className="flex items-center gap-2">
                        {me && <span className="text-sm text-[#5A5A72]">{me.username}</span>}
                        <div className="w-7 h-7 rounded-full bg-[#1A1A2E] text-white text-xs flex items-center justify-center">
                            {me ? initials(me.username) : '?'}
                        </div>
                        <button
                            onClick={logout}
                            className="text-xs text-[#5A5A72] hover:text-[#1A1A2E] transition-colors ml-2"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

                    
                    <div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="group w-full flex items-center justify-between gap-3 py-7 px-7 rounded-3xl bg-gradient-to-br from-[#1A1A2E] to-[#2A2A4A] hover:brightness-110 transition-all mb-3 shadow-xl shadow-[#1A1A2E]/25"
                        >
                            <div className="text-left">
                                <div className="text-white text-xl font-light tracking-wide">Create a room</div>
                                <div className="text-white/50 text-xs mt-1">Start something, invite people in</div>
                            </div>
                            <span className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-[#1A1A2E] bg-[#FF6B35] text-xl font-medium group-hover:rotate-90 transition-transform duration-300">+</span>
                        </button>

                        <div className="flex items-center gap-2 mb-8 bg-white/70 backdrop-blur-md border border-black/[0.09] rounded-2xl px-4 py-3">
                            <span className="text-sm text-[#5A5A72] whitespace-nowrap">Got a code?</span>
                            <input
                                type="text"
                                placeholder="DJXU"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                className="flex-1 bg-transparent text-sm text-[#1A1A2E] font-mono tracking-widest placeholder:text-[#5A5A72] placeholder:opacity-50 focus:outline-none"
                            />
                            <button
                                onClick={() => attemptJoin(roomId)}
                                className="text-sm text-white bg-[#1A1A2E] hover:bg-[#2A2A4A] transition-colors px-4 py-1.5 rounded-full"
                            >
                                Join
                            </button>
                        </div>

                        <div className="flex items-baseline justify-between mb-3 px-1">
                            <span className="text-sm font-medium text-[#1A1A2E]">Open rooms</span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={GetRooms}
                                    className="text-xs text-[#5A5A72] hover:text-[#1A1A2E] transition-colors"
                                >
                                    Refresh
                                </button>
                                <span className="text-xs text-[#5A5A72] opacity-60">{rooms.length} running</span>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3">
                            {rooms.length === 0 && (
                                <div className="col-span-full text-center text-sm text-[#5A5A72] py-8">
                                    No rooms open right now — start one above.
                                </div>
                            )}
                            {rooms.map((room, index) => (
                                <div
                                    key={index}
                                    onClick={() => attemptJoin(room.roomCode, room.hasPassword)}
                                    className="group cursor-pointer relative overflow-hidden bg-white/70 backdrop-blur-md border border-black/[0.09] rounded-2xl p-4 transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#1A1A2E]/10"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: colorForCode(room.roomCode) }}></div>

                                    <div className="flex items-center gap-2 mb-1">
                                        {room.hasPassword && (
                                            <svg className="w-3 h-3 text-[#5A5A72] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <rect x="5" y="11" width="14" height="9" rx="2" />
                                                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                                            </svg>
                                        )}
                                        <span className="text-[16px] font-medium text-[#1A1A2E]">{room.title}</span>
                                    </div>

                                    <span className="font-mono text-[10px] tracking-wider text-[#5A5A72] bg-black/[0.04] px-1.5 py-0.5 rounded">
                                        {room.roomCode}
                                    </span>

                                    <p className="text-sm text-[#5A5A72] opacity-75 mt-2 mb-3 truncate">
                                        {room.description || "No description"}
                                    </p>

                                    <div className="flex">
                                        {room.members.slice(0, 3).map((m, i) => (
                                            <div
                                                key={i}
                                                style={{ background: palette[i % palette.length] }}
                                                className="w-6 h-6 rounded-full text-white text-[10px] flex items-center justify-center -ml-2 first:ml-0 ring-2 ring-white"
                                            >
                                                {initials(m.username)}
                                            </div>
                                        ))}
                                        {room.members.length > 3 && (
                                            <div className="w-6 h-6 rounded-full bg-[#1A1A2E] text-white text-[10px] flex items-center justify-center -ml-2 ring-2 ring-white">
                                                +{room.members.length - 3}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                  
                    <div className="space-y-4">
                        <div className="bg-white/70 backdrop-blur-md border border-black/[0.09] rounded-2xl p-5">
                            <div className="w-11 h-11 rounded-full bg-[#1A1A2E] text-white text-base flex items-center justify-center mb-3">
                                {me ? initials(me.username) : '?'}
                            </div>
                            <div className="text-[15px] font-medium text-[#1A1A2E]">{me?.username}</div>
                            <div className="text-xs text-[#5A5A72] mt-0.5">
                                {me?.timestamp && `Joined ${new Date(me.timestamp).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                            </div>
                        </div>

                        <div className="bg-white/70 backdrop-blur-md border border-black/[0.09] rounded-2xl p-5">
                            <div className="text-sm font-medium text-[#1A1A2E] mb-3">Your activity</div>
                            <div className="flex justify-between text-sm mb-2.5">
                                <span className="text-[#5A5A72]">Rooms created</span>
                                <span className="text-[#1A1A2E] font-medium">{stats?.roomsCreated ?? '—'}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2.5">
                                <span className="text-[#5A5A72]">Rooms joined</span>
                                <span className="text-[#1A1A2E] font-medium">{stats?.roomsJoined ?? '—'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[#5A5A72]">Messages sent</span>
                                <span className="text-[#1A1A2E] font-medium">{stats?.totalMessages ?? '—'}</span>
                            </div>
                        </div>

                        <div className="bg-white/70 backdrop-blur-md border border-black/[0.09] rounded-2xl p-5">
                            <div className="text-sm font-medium text-[#1A1A2E] mb-3">Recently active</div>
                            {recents.slice(0, 5).map((r, i) => (
                                <div key={i} className="flex items-center gap-2.5 mb-3 last:mb-0">
                                    <div
                                        style={{ background: colorForCode(r.roomCode) }}
                                        className="w-6 h-6 rounded-full text-white text-[10px] flex items-center justify-center shrink-0"
                                    >
                                        {initials(r.leader?.username)}
                                    </div>
                                    <span className="text-xs text-[#5A5A72]">
                                        <span className="text-[#1A1A2E]">{r.leader?.username}</span> started <span className="text-[#1A1A2E]">{r.title}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

           
            {showCreateModal && (
                <div
                    onClick={() => setShowCreateModal(false)}
                    className="fixed inset-0 z-50 bg-[#1A1A2E]/40 backdrop-blur-sm flex items-center justify-center p-5"
                >
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-[20px] p-7 w-full max-w-[360px]">
                        <h3 className="text-[#1A1A2E] font-medium mb-4">Create a room</h3>

                        <label className="block text-xs text-[#5A5A72] mt-3 mb-1">Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Design crit"
                            className="w-full px-3 py-2.5 border border-black/[0.09] rounded-[10px] outline-none focus:border-[#1A1A2E]"
                        />

                        <label className="block text-xs text-[#5A5A72] mt-3 mb-1">Description</label>
                        <input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's this room for?"
                            className="w-full px-3 py-2.5 border border-black/[0.09] rounded-[10px] outline-none focus:border-[#1A1A2E]"
                        />

                        <label className="block text-xs text-[#5A5A72] mt-3 mb-1">Member limit</label>
                        <input
                            type="number"
                            min={2}
                            value={membersLimit}
                            onChange={(e) => setMembersLimit(Number(e.target.value))}
                            className="w-full px-3 py-2.5 border border-black/[0.09] rounded-[10px] outline-none focus:border-[#1A1A2E]"
                        />

                        <label className="block text-xs text-[#5A5A72] mt-3 mb-1">Password (optional)</label>
                        <input
                            value={password}
                            maxLength={6}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (/^[A-Za-z]*$/.test(value)) setPassword(value);
                            }}
                            placeholder="letters only, max 6"
                            className="w-full px-3 py-2.5 border border-black/[0.09] rounded-[10px] outline-none focus:border-[#1A1A2E]"
                        />

                        <div className="flex justify-end gap-2 mt-5">
                            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-full text-sm text-[#5A5A72]">Cancel</button>
                            <button onClick={newRoom} className="px-4 py-2 rounded-full text-sm bg-[#1A1A2E] text-white">Create</button>
                        </div>
                    </div>
                </div>
            )}

           
            {showJoinModal && (
                <div
                    onClick={() => setShowJoinModal(false)}
                    className="fixed inset-0 z-50 bg-[#1A1A2E]/40 backdrop-blur-sm flex items-center justify-center p-5"
                >
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-[20px] p-7 w-full max-w-[360px]">
                        <h3 className="text-[#1A1A2E] font-medium mb-4">Enter room password</h3>
                        <input
                            value={key}
                            maxLength={6}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="password"
                            className="w-full px-3 py-2.5 border border-black/[0.09] rounded-[10px] outline-none focus:border-[#1A1A2E]"
                        />
                        <div className="flex justify-end gap-2 mt-5">
                            <button onClick={() => setShowJoinModal(false)} className="px-4 py-2 rounded-full text-sm text-[#5A5A72]">Cancel</button>
                            <button onClick={confirmJoinFromModal} className="px-4 py-2 rounded-full text-sm bg-[#1A1A2E] text-white">Join</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
export default Home;