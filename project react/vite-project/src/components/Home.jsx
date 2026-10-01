import React, { useEffect, useState } from "react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";

const serif = "font-[Georgia,'Times_New_Roman',serif]";
const mono = "font-['Courier_New',monospace]";
const PAGE_SIZE = 3;
const MAX_ITEMS = 10;

function Reveal({ children, className = "", delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay, ease: [0.2, 0.7, 0.2, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

function Pager({ page, setPage, count }) {
    if (count <= 1) return null;
    return (
        <div className="flex gap-2 mt-5 ml-1">
            {Array.from({ length: count }).map((_, i) => (
                <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`${mono} text-[10px] w-7 h-7 flex items-center justify-center border transition-colors ${
                        i === page ? 'border-[#20212b] text-[#20212b] font-bold' : 'border-[#cfc8bc] text-[#9a958c] hover:border-[#9a958c]'
                    }`}
                >
                    {i + 1}
                </button>
            ))}
        </div>
    );
}

function Home() {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

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

    const [openPage, setOpenPage] = useState(0);
    const [myPage, setMyPage] = useState(0);
    const [expandedStep, setExpandedStep] = useState(null);

    const newRoom = async () => {
        const token = localStorage.getItem('token');
        const res = await axios.post('/api/rooms', {
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
            const res = await axios.post('/api/rooms/join', { roomCode: roomId, password: key }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data.success === true) {
                navigate(`/room/${roomId}`);
                setKey("");
            }
        } catch (err) {
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
            const msg = err.response?.data?.message;
            if (msg === "invalid password") {
                setShowJoinModal(true);
            } else if (msg === "user already in room") {
                navigate(`/room/${code}`);
            } else {
                alert(msg || "Could not join room");
            }
        }
    }

    const confirmJoinFromModal = async () => {
        await JoinRoom(pendingRoomCode);
        setShowJoinModal(false);
        setPendingRoomCode(null);
    }

    const GetRooms = async () => {
        const res = await axios.get('/api/rooms', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const sorted = [...res.data].sort((a, b) => b.members.length - a.members.length);
        setRooms(sorted);
        setOpenPage(0);
        setMyPage(0);
    }

    const GetMe = async () => {
        const res = await axios.get('/api/users/me', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setMe(res.data);
    }

    const GetStats = async () => {
        const res = await axios.get('/api/users/me/stats', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setStats(res.data);
    }

    useEffect(() => {
        GetRooms();
        GetMe();
        GetStats();
    }, []);

    const isMember = (room) => room.members.some(m => m.username === me?.username);
    const myRooms = rooms.filter(isMember).slice(0, MAX_ITEMS);
    const openRooms = rooms.filter(r => !isMember(r)).slice(0, MAX_ITEMS);

    const myPages = Math.max(1, Math.ceil(myRooms.length / PAGE_SIZE));
    const openPages = Math.max(1, Math.ceil(openRooms.length / PAGE_SIZE));
    const myPageItems = myRooms.slice(myPage * PAGE_SIZE, myPage * PAGE_SIZE + PAGE_SIZE);
    const openPageItems = openRooms.slice(openPage * PAGE_SIZE, openPage * PAGE_SIZE + PAGE_SIZE);

    const memberSince = me?.timestamp
        ? `${new Date(me.timestamp).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()} '${String(new Date(me.timestamp).getFullYear()).slice(-2)}`
        : '—';

    const roomRow = (room, i) => (
        <div
            key={room.roomCode}
            onClick={() => (isMember(room) ? navigate(`/room/${room.roomCode}`) : attemptJoin(room.roomCode, room.hasPassword))}
            className="group grid grid-cols-[50px_1fr_120px] md:grid-cols-[75px_1.3fr_0.9fr_150px] gap-5 items-center min-h-[110px] px-2 border-b border-[#cfc8bc] cursor-pointer transition-all duration-200 hover:bg-[#e9e4da] hover:px-4"
        >
            <span className={`${mono} text-[10px] font-bold text-[#9a958c]`}>{String(i + 1).padStart(2, '0')}</span>
            <div className={`${serif} text-2xl md:text-[31px] tracking-tight text-[#20212b]`}>{room.title}</div>
            <p className="hidden md:block text-[11px] leading-relaxed text-[#6e6c68]">{room.description || "No description yet."}</p>
            <div className={`${mono} text-[10px] text-[#6e6c68] text-right`}>
                <strong className="block text-[11px] mb-1.5 text-[#20212b]">{room.roomCode}</strong>
                <span className={room.hasPassword ? "text-[#e85f32]" : "text-[#629b7c]"}>● {room.hasPassword ? "protected" : "open"}</span>
                <br />{room.members.length} / {room.membersLimit} people
            </div>
        </div>
    );

    const stepData = [
        {
            no: "01", h: "Make a room",
            p: "Give it a title, description, member limit and optional password. CoLab gives you the code.",
            detail: "Room codes are four random letters, checked against MongoDB for collisions before one's assigned — nobody ever gets a duplicate. Set a password and it's hashed with bcrypt before it's stored; the plaintext never reaches the database, and never leaves your browser unencrypted either."
        },
        {
            no: "02", h: "Bring your people",
            p: "Share the four-letter code. Protected rooms ask for the password before letting someone in.",
            detail: "Every join is re-verified server-side against your JWT, not just trusted from the UI — the frontend can't fake its way in. Drop your connection and Socket.io reconnects automatically, silently rejoins your last room, and picks the conversation back up without you touching anything."
        },
        {
            no: "03", h: "Make the thing",
            p: "Talk, share and come back later without losing the conversation.",
            detail: "Messages are written to MongoDB the instant they're sent and broadcast live over a Socket.io channel scoped to just that room — nothing leaks across rooms. Anyone who joins later gets the full history on load, so nobody starts a conversation blind."
        },
    ];

    return (
        <div className="bg-[#f1eee6] text-[#20212b] min-h-screen overflow-x-hidden relative">
            <div
                className="fixed inset-0 pointer-events-none z-[-1] opacity-20"
                style={{ backgroundImage: 'radial-gradient(#6c685f 0.55px, transparent 0.55px)', backgroundSize: '13px 13px' }}
            ></div>

            <motion.div className="fixed top-0 left-0 h-[2px] bg-[#e85f32] z-[100] origin-left w-full" style={{ scaleX: progress }} />

            {/* nav */}
            <nav className="h-[72px] px-6 md:px-[5vw] flex items-center justify-between border-b border-[#cfc8bc] sticky top-0 z-50 bg-[#f1eee6]/95">
                <span className="flex items-center gap-2 font-extrabold tracking-tight text-xl">
                    <span className="w-[25px] h-[25px] bg-[#20212b] text-[#d9c34a] flex items-center justify-center text-[13px]">+</span>
                    CoLab
                </span>
                <div className="hidden md:flex gap-8 text-xs text-[#6e6c68]">
                    <a href="#rooms" className="hover:text-[#20212b]">Rooms</a>
                    <a href="#features" className="hover:text-[#20212b]">Inside the room</a>
                    <a href="#how" className="hover:text-[#20212b]">How it works</a>
                </div>
                <div className="flex items-center gap-2.5 text-[11px] text-[#6e6c68]">
                    <span className="w-7 h-7 bg-[#20212b] text-white flex items-center justify-center text-[10px]">
                        {me?.username?.[0]?.toUpperCase() || '?'}
                    </span>
                    <span>{me?.username?.toUpperCase()}</span>
                    <button onClick={logout} className="border-0 bg-transparent text-[#6e6c68] text-[11px] cursor-pointer hover:text-[#20212b]">Logout</button>
                </div>
            </nav>

            {/* hero */}
            <section className="max-w-[1400px] mx-auto min-h-[600px] md:min-h-[720px] px-6 md:px-[5vw] py-16 md:py-[90px] grid md:grid-cols-[1.25fr_0.75fr] gap-10 relative">
                <Reveal className="relative z-[2]">
                    <div className="flex items-center gap-3 mb-7 flex-wrap">
                        <span className={`${mono} text-[10px] font-bold tracking-[0.12em] text-[#e85f32]`}>A PLACE FOR PEOPLE MAKING THINGS</span>
                        <span className={`${mono} text-[9px] tracking-wide text-[#6e6c68] border border-[#cfc8bc] px-2 py-1`}>
                            ● {rooms.length} room{rooms.length === 1 ? '' : 's'} open right now
                        </span>
                    </div>
                    <h1 className={`${serif} leading-[0.8] tracking-[-0.07em] font-normal`} style={{ fontSize: 'clamp(3.2rem,8vw,7.5rem)' }}>
                        Come in.<br /><em className="text-[#e85f32] not-italic">Stay together.</em>
                    </h1>
                    <p className="max-w-[530px] mt-9 ml-1 text-[#6e6c68] text-base leading-relaxed">
                        CoLab gives a group one room to talk, share and keep the conversation around for later. No workspace maze. Just the people and the thing they're working on.
                    </p>
                    <div className="mt-6 ml-1 flex flex-wrap gap-2.5">
                        <button onClick={() => setShowCreateModal(true)} className="px-5 py-3 bg-[#20212b] text-white text-xs hover:-translate-y-0.5 transition-transform">+ Create a room</button>
                        <a href="#rooms" className="px-5 py-3 border border-[#20212b] text-xs hover:-translate-y-0.5 transition-transform inline-block">→ Join a room</a>
                    </div>
                    <div className="mt-4 ml-1 flex items-center gap-2 border border-[#cfc8bc] bg-white/40 px-3 py-2 max-w-[340px]">
                        <span className="text-xs text-[#6e6c68] whitespace-nowrap">Got a code?</span>
                        <input
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            placeholder="DJXU"
                            className={`${mono} flex-1 bg-transparent text-sm tracking-widest outline-none placeholder:text-[#9a958c]`}
                        />
                        <button onClick={() => attemptJoin(roomId)} className="text-xs bg-[#20212b] text-white px-3 py-1.5">Join</button>
                    </div>
                </Reveal>

                {/* simple room snapshot — shows the core idea without pretending to be the real room UI */}
                <Reveal delay={0.1} className="relative min-h-[380px] md:min-h-[540px]">
                    <div className="absolute right-0 md:right-[3%] top-6 md:top-[50px] w-full max-w-[470px] h-[400px] md:h-[455px] border border-[#20212b] bg-[#ebe6dc] p-5 md:p-7" style={{ transform: 'rotate(1deg)' }}>
                        <div className="flex items-center justify-between border-b border-[#cfc8bc] pb-4">
                            <div className={`${mono} text-[10px] font-bold`}>
                                ROOM / <span className="text-[#e85f32]">DSGN</span>
                            </div>
                            <div className={`${mono} text-[9px] text-[#6e6c68]`}>3 people here</div>
                        </div>

                        <div className="mt-5 grid grid-cols-[1.25fr_0.75fr] gap-4 h-[285px]">
                            {/* The shared board is deliberately the main visual. */}
                            <div className="border border-[#cfc8bc] bg-[#20212b] p-4 relative overflow-hidden">
                                <div className={`${mono} text-[8px] text-[#a9a6a0]`}>SHARED BOARD</div>
                                <div className={`${serif} text-[26px] text-[#f0ece3] mt-8 leading-none`}>
                                    Sketch it<br />together.
                                </div>

                                <div className="flex items-center gap-2 mt-7">
                                    <span className={`${mono} text-[7px] bg-[#d9c34a] text-[#20212b] px-2 py-1`}>idea</span>
                                    <span className="text-[#e85f32] text-xs">→</span>
                                    <span className={`${mono} text-[7px] bg-[#b3a7ff] text-[#20212b] px-2 py-1`}>change</span>
                                    <span className="text-[#e85f32] text-xs">→</span>
                                    <span className={`${mono} text-[7px] bg-[#f0ece3] text-[#20212b] px-2 py-1`}>done</span>
                                </div>

                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                    <span className={`${mono} text-[7px] text-[#a9a6a0]`}>everyone sees the same board</span>
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#d9c34a] border border-[#f8f5ed]" />
                                </div>
                            </div>

                            {/* Chat is intentionally secondary. */}
                            <div className="border border-[#cfc8bc] bg-[#f8f5ed] p-3 relative overflow-hidden">
                                <div className={`${mono} text-[8px] text-[#6e6c68] mb-4`}>CHAT</div>
                                <div className="space-y-3">
                                    <div className="flex gap-1.5 items-start">
                                        <span className="w-5 h-5 shrink-0 rounded-full bg-[#e85f32] text-white text-[8px] flex items-center justify-center font-bold">A</span>
                                        <div className={`${mono} text-[8px] leading-relaxed bg-[#ebe6dc] px-2 py-1.5`}>
                                            change the hero?
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5 items-start">
                                        <span className="w-5 h-5 shrink-0 rounded-full bg-[#629b7c] text-white text-[8px] flex items-center justify-center font-bold">R</span>
                                        <div className={`${mono} text-[8px] leading-relaxed bg-[#ebe6dc] px-2 py-1.5`}>
                                            put it on the board
                                        </div>
                                    </div>
                                </div>
                                <div className={`${mono} absolute bottom-3 left-3 right-3 text-[7px] text-[#9a958c]`}>
                                    talk → sketch
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`${serif} hidden sm:block absolute left-[-10px] bottom-0 italic text-base text-[#77716a]`} style={{ transform: 'rotate(-4deg)' }}>
                        talk → work → keep going
                    </div>
                </Reveal>
            </section>

            {/* rooms */}
            <section id="rooms" className="max-w-[1250px] mx-auto px-6 md:px-[5vw] py-20 md:py-[100px]">
                <Reveal className="flex items-baseline gap-4 border-t border-[#20212b] pt-3.5 mb-10">
                    <span className={`${mono} text-[10px] font-bold text-[#e85f32]`}>01</span>
                    <h2 className={`${serif} font-normal`} style={{ fontSize: 'clamp(2.5rem,6vw,4.5rem)' }}>Rooms</h2>
                    <div className="ml-auto flex items-center gap-4">
                        <button onClick={() => GetRooms()} className="text-[11px] text-[#6e6c68] hover:text-[#20212b]">refresh</button>
                        <small className="text-[11px] text-[#6e6c68]">{rooms.length} total</small>
                    </div>
                </Reveal>

                {myRooms.length > 0 && (
                    <>
                        <Reveal className={`${mono} text-[10px] font-bold text-[#6e6c68] mb-2`}>YOU'RE ALREADY IN</Reveal>
                        <div className="border-t border-[#cfc8bc] mb-3">
                            {myPageItems.map((r, i) => <Reveal key={r.roomCode}>{roomRow(r, myPage * PAGE_SIZE + i)}</Reveal>)}
                        </div>
                        <Pager page={myPage} setPage={setMyPage} count={myPages} />
                        <div className="mb-10"></div>
                    </>
                )}

                <div className="border-t border-[#cfc8bc]">
                    {openRooms.length === 0 ? (
                        <Reveal className="py-16 text-center text-sm text-[#6e6c68]">No open rooms right now — start one above.</Reveal>
                    ) : (
                        openPageItems.map((r, i) => <Reveal key={r.roomCode}>{roomRow(r, openPage * PAGE_SIZE + i)}</Reveal>)
                    )}
                </div>
                <Pager page={openPage} setPage={setOpenPage} count={openPages} />
            </section>

            {/* features (dark) */}
            <section id="features" className="bg-[#20212b] text-[#eee] relative overflow-hidden">
                <div className="max-w-[1250px] mx-auto px-6 md:px-[5vw] py-24 md:py-[120px]">
                    <Reveal className="grid md:grid-cols-[1fr_0.8fr] gap-14 items-end mb-16">
                        <h2 className={`${serif} font-normal leading-[0.85] tracking-[-0.06em]`} style={{ fontSize: 'clamp(2.8rem,7vw,5.5rem)' }}>
                            What happens<br /><em className="text-[#d9c34a] not-italic">inside?</em>
                        </h2>
                        <p className="text-sm text-[#a9a6a0] leading-relaxed max-w-[430px]">
                            The room isn't just where messages appear. It's where the conversation and the work live together — chat beside a shared whiteboard, with the people actually doing it.
                        </p>
                    </Reveal>

                    <div className="grid md:grid-cols-2 gap-12 border-t border-[#45454d] pt-8">
                        <Reveal className="h-[420px] border border-[#4a4a51] relative overflow-hidden bg-[#22232e]">
                            <div className={`${mono} absolute left-5 top-5 text-[10px] text-[#aaa]`}>
                                SHARED WHITEBOARD · LIVE
                            </div>

                            <div className={`${mono} absolute left-5 top-14 text-[9px] text-[#777]`}>
                                one board · everyone sees the changes
                            </div>

                            <div className="absolute left-[13%] right-[13%] top-[27%] bottom-[24%] border border-[#55555d] bg-[#292a35] p-6">
                                <div className={`${mono} text-[9px] text-[#8f8d86]`}>ROOM IDEA</div>
                                <div className={`${serif} text-3xl text-[#f0ece3] mt-4`}>Build it together.</div>

                                <div className="flex items-center gap-3 mt-8">
                                    <div className={`${mono} text-[9px] bg-[#d9c34a] text-[#20212b] px-2 py-1`}>idea</div>
                                    <span className="text-[#e85f32]">→</span>
                                    <div className={`${mono} text-[9px] bg-[#b3a7ff] text-[#20212b] px-2 py-1`}>change</div>
                                    <span className="text-[#e85f32]">→</span>
                                    <div className={`${mono} text-[9px] bg-[#f0ece3] text-[#20212b] px-2 py-1`}>done</div>
                                </div>

                                {/* Presence stays physically attached to the board. */}
                                <div className="absolute right-5 bottom-5 flex items-center gap-2">
                                    <span className={`${mono} text-[8px] text-[#d9c34a]`}>rhea is editing</span>
                                    <span className="block w-3 h-3 rounded-full bg-[#d9c34a] border-2 border-[#292a35]" />
                                </div>

                                <div className="absolute left-5 bottom-5 flex items-center gap-2">
                                    <span className="block w-3 h-3 rounded-full bg-[#b3a7ff] border-2 border-[#292a35]" />
                                    <span className={`${mono} text-[8px] text-[#b3a7ff]`}>leo is editing</span>
                                </div>
                            </div>

                            <div className={`${mono} absolute left-5 bottom-5 right-5 text-[9px] text-[#8a8880] border-t border-[#3a3a42] pt-3`}>
                                people in the room · everyone sees the same changes
                            </div>
                        </Reveal>

                        <Reveal delay={0.1}>
                            <div className={`${mono} text-[10px] text-[#d9c34a] mb-2`}>01 / WHITEBOARD</div>
                            <h3 className={`${serif} font-normal leading-tight`} style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)' }}>Talk about it.<br />Then draw it.</h3>
                            <p className="text-[#999] text-[13px] leading-relaxed mt-4 mb-6">The whiteboard becomes part of the room instead of a separate tool — sketch while everyone talks, and keep the result where the conversation happened.</p>
                            {[
                                { n: "02", h: "Realtime chat", p: "Messages arrive instantly and the conversation sticks around in the room." },
                                { n: "03", h: "Room control", p: "Passwords, member limits and leadership keep each room intentional." },
                                { n: "04", h: "People first", p: "See who's actually in the room, not a ticket queue." },
                            ].map(f => (
                                <div key={f.n} className="grid grid-cols-[35px_1fr] gap-4 py-4 border-b border-[#45454d]">
                                    <b className={`${mono} text-[10px] text-[#d9c34a]`}>{f.n}</b>
                                    <div>
                                        <h4 className={`${serif} text-xl font-normal m-0`}>{f.h}</h4>
                                        <p className="text-[#999] text-[11px] leading-relaxed mt-1">{f.p}</p>
                                    </div>
                                </div>
                            ))}
                        </Reveal>
                    </div>

                    <Reveal className="grid grid-cols-2 md:grid-cols-4 border-t border-b border-[#45454d] mt-14">
                        {[["40", "maximum room members"], ["4", "character room code"], ["∞", "persistent messages"], ["1", "shared room"]].map(([v, l], i) => (
                            <div key={i} className={`p-6 ${i !== 3 ? 'md:border-r' : ''} border-b md:border-b-0 border-[#45454d]`}>
                                <strong className={`${serif} text-4xl font-normal`}>{v}</strong>
                                <span className="block text-[10px] text-[#a9a6a0] mt-2">{l}</span>
                            </div>
                        ))}
                    </Reveal>
                </div>
            </section>

            {/* how it works — now a real accordion */}
            <section id="how" className="max-w-[1250px] mx-auto px-6 md:px-[5vw] py-20 md:py-[100px]">
                <Reveal className="flex items-baseline gap-4 border-t border-[#20212b] pt-3.5 mb-10">
                    <span className={`${mono} text-[10px] font-bold text-[#e85f32]`}>02</span>
                    <h2 className={`${serif} font-normal`} style={{ fontSize: 'clamp(2.5rem,6vw,4.5rem)' }}>How it works</h2>
                    <small className="ml-auto text-[11px] text-[#6e6c68]">tap a step for the details</small>
                </Reveal>
                <div className="mt-8">
                    {stepData.map((step, i) => {
                        const isOpen = expandedStep === i;
                        return (
                            <Reveal key={step.no} delay={i * 0.05} className={`border-b ${i === 0 ? 'border-t' : ''} border-[#cfc8bc]`}>
                                <button
                                    onClick={() => setExpandedStep(isOpen ? null : i)}
                                    className="w-full text-left grid grid-cols-[40px_1fr_30px] md:grid-cols-[60px_1fr_1.2fr_35px] gap-5 items-center py-6"
                                >
                                    <span className={`${mono} text-[10px] text-[#e85f32]`}>{step.no}</span>
                                    <h3 className={`${serif} text-2xl md:text-3xl font-normal`}>{step.h}</h3>
                                    <p className="hidden md:block text-xs text-[#6e6c68] leading-relaxed">{step.p}</p>
                                    <span
                                        className="w-8 h-8 border border-[#cfc8bc] flex items-center justify-center transition-transform duration-300"
                                        style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </span>
                                </button>
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
                                            className="overflow-hidden"
                                        >
                                            <p className={`${mono} text-[11px] leading-relaxed text-[#6e6c68] pb-6 pl-0 md:pl-[80px] pr-8 max-w-[600px]`}>
                                                {step.detail}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Reveal>
                        );
                    })}
                </div>
            </section>

            {/* your activity — real backend data */}
            <section className="max-w-[1250px] mx-auto px-6 md:px-[5vw] pb-10">
                <Reveal className="flex items-baseline gap-4 border-t border-[#20212b] pt-3.5 mb-10">
                    <span className={`${mono} text-[10px] font-bold text-[#e85f32]`}>03</span>
                    <h2 className={`${serif} font-normal`} style={{ fontSize: 'clamp(2.5rem,6vw,4.5rem)' }}>Your activity</h2>
                    <small className="ml-auto text-[11px] text-[#6e6c68]"></small>
                </Reveal>
                <Reveal className="grid grid-cols-2 md:grid-cols-4 border-t border-b border-[#cfc8bc]">
                    {[
                        [stats?.roomsCreated ?? '—', "rooms created"],
                        [stats?.roomsJoined ?? '—', "rooms joined"],
                        [stats?.totalMessages ?? '—', "messages sent"],
                        [memberSince, "member since"],
                    ].map(([v, l], i) => (
                        <div key={i} className={`p-6 ${i !== 3 ? 'md:border-r' : ''} border-b md:border-b-0 border-[#cfc8bc]`}>
                            <strong className={`${serif} text-4xl font-normal`}>{v}</strong>
                            <span className="block text-[10px] text-[#6e6c68] mt-2">{l}</span>
                        </div>
                    ))}
                </Reveal>
            </section>

            {/* CTA */}
            <section className="bg-[#d9c34a] py-24 md:py-[120px] px-6 text-center">
                <Reveal>
                    <h2 className={`${serif} font-normal leading-[0.85] tracking-[-0.06em]`} style={{ fontSize: 'clamp(3rem,8vw,6.5rem)' }}>
                        Alright.<br />Make a room.
                    </h2>
                    <p className="text-[#5f592e] text-sm max-w-[430px] mx-auto my-6 leading-relaxed">
                        Start with the people. Figure the rest out inside.
                    </p>
                    <button onClick={() => setShowCreateModal(true)} className="px-6 py-3.5 bg-[#20212b] text-white text-xs">+ Create your first room</button>
                </Reveal>
            </section>

            {/* create room modal */}
            {showCreateModal && (
                <div onClick={() => setShowCreateModal(false)} className="fixed inset-0 z-50 bg-[#20212b]/50 flex items-center justify-center p-5">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#f8f5ed] border border-[#20212b] p-7 w-full max-w-[380px]"
                    >
                        <h3 className={`${serif} text-2xl mb-5`}>Create a room</h3>
                        <label className={`${mono} block text-[10px] text-[#6e6c68] mt-3 mb-1`}>TITLE</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Design critique" className="w-full px-3 py-2.5 border border-[#cfc8bc] bg-white outline-none focus:border-[#20212b]" />
                        <label className={`${mono} block text-[10px] text-[#6e6c68] mt-3 mb-1`}>DESCRIPTION</label>
                        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this room for?" className="w-full px-3 py-2.5 border border-[#cfc8bc] bg-white outline-none focus:border-[#20212b]" />
                        <label className={`${mono} block text-[10px] text-[#6e6c68] mt-3 mb-1`}>MEMBER LIMIT</label>
                        <input type="number" min={2} value={membersLimit} onChange={(e) => setMembersLimit(Number(e.target.value))} className="w-full px-3 py-2.5 border border-[#cfc8bc] bg-white outline-none focus:border-[#20212b]" />
                        <label className={`${mono} block text-[10px] text-[#6e6c68] mt-3 mb-1`}>PASSWORD (OPTIONAL)</label>
                        <input
                            value={password} maxLength={6}
                            onChange={(e) => { if (/^[A-Za-z]*$/.test(e.target.value)) setPassword(e.target.value); }}
                            placeholder="letters only, max 6"
                            className="w-full px-3 py-2.5 border border-[#cfc8bc] bg-white outline-none focus:border-[#20212b]"
                        />
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-[#6e6c68] border border-[#cfc8bc]">Cancel</button>
                            <button onClick={newRoom} className="px-4 py-2 text-sm bg-[#20212b] text-white">Create</button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* join password modal */}
            {showJoinModal && (
                <div onClick={() => setShowJoinModal(false)} className="fixed inset-0 z-50 bg-[#20212b]/50 flex items-center justify-center p-5">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#f8f5ed] border border-[#20212b] p-7 w-full max-w-[380px]"
                    >
                        <h3 className={`${serif} text-2xl mb-5`}>Enter room password</h3>
                        <input
                            value={key} maxLength={6} onChange={(e) => setKey(e.target.value)}
                            placeholder="password"
                            className="w-full px-3 py-2.5 border border-[#cfc8bc] bg-white outline-none focus:border-[#20212b]"
                        />
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setShowJoinModal(false)} className="px-4 py-2 text-sm text-[#6e6c68] border border-[#cfc8bc]">Cancel</button>
                            <button onClick={confirmJoinFromModal} className="px-4 py-2 text-sm bg-[#20212b] text-white">Join</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

export default Home;