import React, { useContext, useEffect, useRef, useState } from "react";
import { socketContext } from "../context/Socket_context";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const colors = ["#20212b", "#b33a3a", "#2d6a4f", "#3b5b92", "#9a5b13"];
const PEN_WIDTH = 3;
const ERASER_WIDTH = 18;
function Icon({ name, size = 17 }) {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.7,
        strokeLinecap: "round",
        strokeLinejoin: "round",
    };

    if (name === "pen") return <svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" /></svg>;
    if (name === "eraser") return <svg {...common}><path d="m7 21 10-10" /><path d="m17 3 4 4-11 11H5l-2-2Z" /><path d="m14 6 4 4" /></svg>;
    if (name === "home") return <svg {...common}><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></svg>;
    if (name === "send") return <svg {...common}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>;
    if (name === "users") return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    if (name === "message") return <svg {...common}><path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 9.9 9.9 0 0 1-4-.8L3 21l1.8-4.2A8.1 8.1 0 0 1 3 11.5 8.38 8.38 0 0 1 12 3a8.38 8.38 0 0 1 9 8.5Z" /></svg>;
    if (name === "leave") return <svg {...common}><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 3v18" /></svg>;
    if (name === "trash") return <svg {...common}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 15H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>;
    return null;
}

function Room() {
    const { socket } = useContext(socketContext);
    const { roomCode } = useParams();
    const navigate = useNavigate();

    const [msg, setMsg] = useState("");
    const [roomExist, setRoomExist] = useState(false);
    const [chat, setChat] = useState([]);
    const [leader, setLeader] = useState("");
    const [members, setMembers] = useState([]);
    const [currentUser, setCurrentUser] = useState("");
    const [lastAttempted, setLastAttempted] = useState("");
    const [error, SetError] = useState("");

    const [drawingEnabled, setDrawingEnabled] = useState(false);
    const [drawingColor, setDrawingColor] = useState("#20212b");
    const [drawingUsers, setDrawingUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [chatOpen, setChatOpen] = useState(false);

    const boardRef = useRef(null);
    const drawingEnabledRef = useRef(false);
    const drawingColorRef = useRef("#20212b");
    const typingTimerRef = useRef(null);
    const typingPendingRef = useRef(true);
    const lastAttemptedRef = useRef('');
    useEffect(() => { lastAttemptedRef.current = lastAttempted; }, [lastAttempted]);
    useEffect(() => {
        drawingEnabledRef.current = drawingEnabled;
    }, [drawingEnabled]);

    useEffect(() => {
        drawingColorRef.current = drawingColor;
    }, [drawingColor]);

    useEffect(() => {
        const checkRoom = async () => {
            try {
                const reply = await axios.get(`/api/rooms/${roomCode}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });

                if (reply.data.success) {
                    setRoomExist(true);
                    setLeader(reply.data.room.leader.username);
                    setCurrentUser(reply.data.currentUser);
                    setMembers(reply.data.room.members.map((val) => val.username));
                } else {
                    setRoomExist(false);
                }
            } catch (err) {
                setRoomExist(false);
                SetError(err.response?.data?.message || "Could not enter this room.");
            }
        };

        checkRoom();
    }, [roomCode]);

    useEffect(() => {
        if (!socket || !roomExist) return;

        const getMessage = async () => {
            try {
                const reply = await axios.get(`/api/rooms/messages/${roomCode}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });

                const temp = reply.data.message.map(
                    (obj) => `${obj.sender.username} : ${obj.message}`
                );
                setChat(temp);
            } catch (err) {
                console.log(err);
            }
        };

        getMessage();
    }, [roomCode, roomExist, socket]);

    useEffect(() => {
        if (!socket || !roomExist) return;

        const joinRoom = () => socket.emit("room-join", roomCode);

        const handleRoomJoined = (socketName) => {
            setMembers((prev) => prev.includes(socketName) ? prev : [...prev, socketName]);
        };

        const handleMessage = (message, username) => {
            setChat((prev) => [...prev, `${username} : ${message}`]);
        };

        const handleUserLeft = (username) => {
            setMembers((prev) => prev.filter((member) => member !== username));
            setDrawingUsers((prev) => prev.filter((user) => user !== username));
            setTypingUsers((prev) => prev.filter((user) => user !== username));
        };

        const handleRoomDelete = () => navigate("/home", { replace: true });
        const handleLeaderChanged = (username) => setLeader(username);

        const handleMessageFailed = (err) => {
            alert(err);
            setMsg(lastAttemptedRef.current);
        };

        const handleStartedDrawing = ({ username }) => {
            setDrawingUsers((prev) => prev.includes(username) ? prev : [...prev, username]);
        };

        const handleStoppedDrawing = ({ username }) => {
            setDrawingUsers((prev) => prev.filter((user) => user !== username));
        };

        const handleStartedTyping = ({ username }) => {
            setTypingUsers((prev) => prev.includes(username) ? prev : [...prev, username]);
        };

        const handleStoppedTyping = ({ username }) => {
            setTypingUsers((prev) => prev.filter((user) => user !== username));
        };

        socket.on("connect", joinRoom);
        socket.on("message", handleMessage);
        socket.on("room-joined", handleRoomJoined);
        socket.on("user-left", handleUserLeft);
        socket.on("room-deleted", handleRoomDelete);
        socket.on("leader-changed", handleLeaderChanged);
        socket.on("message-failed", handleMessageFailed);
        socket.on("user-started-drawing", handleStartedDrawing);
        socket.on("user-stopped-drawing", handleStoppedDrawing);
        socket.on("user-started-typing", handleStartedTyping);
        socket.on("user-stopped-typing", handleStoppedTyping);

        if (socket.connected) joinRoom();

        return () => {
            socket.off("connect", joinRoom);
            socket.off("message", handleMessage);
            socket.off("room-joined", handleRoomJoined);
            socket.off("user-left", handleUserLeft);
            socket.off("room-deleted", handleRoomDelete);
            socket.off("leader-changed", handleLeaderChanged);
            socket.off("message-failed", handleMessageFailed);
            socket.off("user-started-drawing", handleStartedDrawing);
            socket.off("user-stopped-drawing", handleStoppedDrawing);
            socket.off("user-started-typing", handleStartedTyping);
            socket.off("user-stopped-typing", handleStoppedTyping);
        };
    }, [socket, roomCode, roomExist]);

    useEffect(() => {
        if (!roomExist || !socket) return;

        const board = boardRef.current;
        if (!board) return;

        const ctx = board.getContext("2d");
        let buffer = [];
        let strokeId = null;
        let isDrawing = false;
        let rafId = null;
        let lastX;
        let lastY;
        const incomingStrokeId = {};

        const loop = () => {
            if (buffer.length > 0) {
                socket.emit("draw", {
                    strokeId,
                    points: buffer.map((p) => ({
                        x: p.x / board.width,
                        y: p.y / board.height
                    })),
                    color: drawingColorRef.current,
                    roomCode
                });
                buffer = [];
            }

            if (isDrawing) rafId = requestAnimationFrame(loop);
            else rafId = null;
        };

        const handleIncoming = ({ strokeId, points, color }) => {
            const scaledPoints = points.map((p) => ({
                x: p.x * board.width,
                y: p.y * board.height
            }));

            let prev = incomingStrokeId[strokeId];
            ctx.strokeStyle = color || "#20212b";
            ctx.lineWidth = color === "#ffffff" ? ERASER_WIDTH : PEN_WIDTH;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

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

        socket.on("draw", handleIncoming);

        const getMousePos = (e) => {
            const rect = board.getBoundingClientRect();
            return {
                x: (e.clientX - rect.left) * (board.width / rect.width),
                y: (e.clientY - rect.top) * (board.height / rect.height)
            };
        };

        const handlePointerDown = (e) => {
            if (!drawingEnabledRef.current) return;

            const pos = getMousePos(e);
            strokeId = `${socket.id}-${Date.now()}`;
            lastX = pos.x;
            lastY = pos.y;
            isDrawing = true;
            buffer = [pos];

            ctx.strokeStyle = drawingColorRef.current;
            ctx.lineWidth =
                drawingColorRef.current === "#ffffff"
                    ? ERASER_WIDTH
                    : PEN_WIDTH;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            socket.emit("user-started-drawing", roomCode);
            if (!rafId) loop();
        };

        const handlePointerMove = (e) => {
            if (!isDrawing || !drawingEnabledRef.current) return;

            const pos = getMousePos(e);
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();

            lastX = pos.x;
            lastY = pos.y;
            buffer = [...buffer, pos];
        };

        const handlePointerUp = () => {
            if (!isDrawing) return;

            isDrawing = false;
            socket.emit("user-stopped-drawing", roomCode);
        };

        board.addEventListener("pointerdown", handlePointerDown);
        board.addEventListener("pointermove", handlePointerMove);
        document.addEventListener("pointerup", handlePointerUp);

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            board.removeEventListener("pointerdown", handlePointerDown);
            board.removeEventListener("pointermove", handlePointerMove);
            document.removeEventListener("pointerup", handlePointerUp);
            socket.off("draw", handleIncoming);
        };
    }, [roomExist, socket, roomCode]);

    const Send = () => {
        if (!msg.trim() || !socket) return;

        socket.emit("message", msg, roomCode);
        setLastAttempted(msg);
        setMsg("");

        clearTimeout(typingTimerRef.current);
        typingPendingRef.current = true;
        socket.emit("user-stopped-typing", roomCode);
    };

    const handleTyping = (value) => {
        setMsg(value);
        if (!socket) return;

        if (typingPendingRef.current) {
            socket.emit("user-started-typing", roomCode);
            typingPendingRef.current = false;
        }

        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            socket.emit("user-stopped-typing", roomCode);
            typingPendingRef.current = true;
        }, 1000);
    };

    const sendDelete = async () => {
        try {
            await axios.delete(`/api/rooms/delete/${roomCode}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
        } catch (err) {
            console.log(err);
        }
    };

    const Leave = async () => {
        try {
            await axios.post(`/api/rooms/leave/${roomCode}`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            navigate("/home", { replace: true });
        } catch (err) {
            console.log(err.response);
        }
    };

    useEffect(() => {
        return () => clearTimeout(typingTimerRef.current);
    }, []);

    const isLeader = leader === currentUser;

    const statusText = [
        ...drawingUsers.map((user) => `${user} is drawing`),
        ...typingUsers.map((user) => `${user} is typing`)
    ];

    if (!roomExist) {
        return (
            <div className="min-h-screen bg-[#f4f0e8] text-[#20212b] flex items-center justify-center px-6">
                <div className="w-full max-w-xl border border-[#cfc8bc] bg-[#f8f5ef] p-8">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8d887f] mb-3">ROOM ERROR</p>
                    <h1 className="font-[Georgia,'Times_New_Roman',serif] text-3xl">{error || "Room unavailable."}</h1>
                    <button
                        onClick={() => navigate("/home")}
                        className="mt-7 inline-flex items-center gap-2 border border-[#20212b] px-4 py-2 text-xs uppercase tracking-wider hover:bg-[#20212b] hover:text-[#f8f5ef] transition-colors"
                    >
                        <Icon name="home" size={15} /> Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f4f0e8] text-[#20212b] font-sans select-none">
            <header className="h-[76px] border-b border-[#cfc8bc] bg-[#f8f5ef] flex items-center justify-between px-4 sm:px-7">
                <div className="flex items-center gap-4 min-w-0">
                    <button
                        onClick={() => navigate("/home")}
                        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] hover:opacity-60 transition-opacity shrink-0"
                    >
                        <Icon name="home" size={16} />
                        <span className="hidden sm:inline">Home</span>
                    </button>
                    <span className="h-5 w-px bg-[#cfc8bc]" />
                    <div className="min-w-0">
                        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#8d887f]">COLAB / ROOM</p>
                        <h1 className="font-[Georgia,'Times_New_Roman',serif] text-lg sm:text-xl truncate">{roomCode}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {statusText.length > 0 && (
                        <div className="hidden md:block text-xs text-[#777168] truncate max-w-[300px]">
                            {statusText.join(" · ")}...
                        </div>
                    )}
                    <button
                        onClick={() => setChatOpen((prev) => !prev)}
                        className="md:hidden inline-flex items-center gap-2 border border-[#cfc8bc] px-3 py-2 text-xs uppercase tracking-wider bg-[#f4f0e8]"
                    >
                        <Icon name="message" size={15} /> Chat
                    </button>
                </div>
            </header>

            <main className="relative h-[calc(100vh-76px)] min-h-[650px] p-3 sm:p-5 lg:p-6 overflow-hidden">
                <div className="h-full grid grid-cols-1 md:grid-cols-[210px_minmax(0,1fr)_320px] gap-4 lg:gap-5">
                    <aside className="hidden md:flex flex-col border border-[#cfc8bc] bg-[#f8f5ef] min-h-0">
                        <div className="p-5 border-b border-[#cfc8bc]">
                            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8d887f] mb-2">ROOM LEADER</p>
                            <p className="font-[Georgia,'Times_New_Roman',serif] text-xl break-words">{leader}</p>
                            <p className="font-mono text-[9px] text-[#9a958c] mt-1">YOU: {currentUser}</p>
                        </div>

                        <div className="p-5 flex-1 overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8d887f]">MEMBERS</p>
                                <span className="font-mono text-[10px] text-[#8d887f]">{members.length}</span>
                            </div>
                            <div className="space-y-2">
                                {members.map((member, index) => (
                                    <div key={`${member}-${index}`} className="flex items-center gap-2 text-sm py-1">
                                        <span className="w-1.5 h-1.5 bg-[#777168] shrink-0" />
                                        <span className="truncate">{member}</span>
                                        {member === leader && <span className="ml-auto font-mono text-[8px] text-[#9a958c]">L</span>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 border-t border-[#cfc8bc] space-y-2">
                            <button
                                onClick={Leave}
                                className="w-full flex items-center justify-center gap-2 border border-[#cfc8bc] px-3 py-2.5 text-xs uppercase tracking-wider hover:border-[#20212b] transition-colors"
                            >
                                <Icon name="leave" size={15} /> Leave room
                            </button>
                            {isLeader && (
                                <button
                                    onClick={sendDelete}
                                    className="w-full flex items-center justify-center gap-2 border border-[#b8a8a0] text-[#8b4039] px-3 py-2.5 text-xs uppercase tracking-wider hover:bg-[#eee3de] transition-colors"
                                >
                                    <Icon name="trash" size={15} /> Delete room
                                </button>
                            )}
                        </div>
                    </aside>

                    <section className="min-w-0 min-h-0 flex flex-col border border-[#cfc8bc] bg-[#f8f5ef]">
                        <div className="h-[58px] shrink-0 border-b border-[#cfc8bc] flex items-center justify-between px-3 sm:px-5">
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => {
                                        if (drawingColor === "#ffffff") {
                                            setDrawingColor("#20212b");
                                            setDrawingEnabled(true);
                                        } else {
                                            setDrawingEnabled((prev) => !prev);
                                        }
                                    }}
                                    className={`inline-flex items-center gap-2 px-3 py-2 border text-xs uppercase tracking-wider transition-colors ${drawingEnabled && drawingColor !== "#ffffff" ? "border-[#20212b] bg-[#20212b] text-[#f8f5ef]" : "border-[#cfc8bc] hover:border-[#20212b]"}`}
                                >
                                    <Icon name="pen" size={15} />
                                    <span className="hidden sm:inline">Pen</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setDrawingColor("#ffffff");
                                        setDrawingEnabled(true);
                                    }}
                                    className={`inline-flex items-center gap-2 px-3 py-2 border text-xs uppercase tracking-wider transition-colors ${drawingEnabled && drawingColor === "#ffffff" ? "border-[#20212b] bg-[#20212b] text-[#f8f5ef]" : "border-[#cfc8bc] hover:border-[#20212b]"}`}
                                >
                                    <Icon name="eraser" size={15} />
                                    <span className="hidden sm:inline">Eraser</span>
                                </button>
                                <span className="h-5 w-px bg-[#cfc8bc] mx-1" />
                                {colors.map((color) => (
                                    <button
                                        key={color}
                                        aria-label={`Use ${color}`}
                                        onClick={() => {
                                            setDrawingColor(color);
                                            setDrawingEnabled(true);
                                        }}
                                        className={`w-6 h-6 border ${(drawingColor === color && (drawingEnabled)) ? "border-[#20212b]" : "border-[#cfc8bc]"} flex items-center justify-center`}
                                    >
                                        <span className="w-3.5 h-3.5" style={{ backgroundColor: color }} />
                                    </button>
                                ))}
                            </div>

                            <div className="hidden sm:block font-mono text-[9px] uppercase tracking-[0.15em] text-[#9a958c]">
                                {drawingEnabled ? (drawingColor === "#ffffff" ? "ERASER ACTIVE" : "DRAWING ACTIVE") : "DRAWING OFF"}
                            </div>
                        </div>

                        <div className="relative flex-1 min-h-0 flex items-center justify-center p-3 sm:p-5 bg-[#eee9df]">
                            <div className="w-full h-full flex items-center justify-center">
                                <canvas
                                    ref={boardRef}
                                    width={600}
                                    height={600}
                                    className="block w-full h-full max-w-[760px] max-h-full border border-[#bdb6aa] bg-white touch-none"
                                />
                            </div>

                            {statusText.length > 0 && (
                                <div className="absolute left-4 bottom-4 max-w-[calc(100%-2rem)] border border-[#cfc8bc] bg-[#f8f5ef] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#777168]">
                                    {statusText.join(" · ")}...
                                </div>
                            )}
                        </div>
                    </section>

                    <aside className={`${chatOpen ? "flex" : "hidden"} md:flex absolute md:static z-30 md:z-auto right-3 top-3 bottom-3 md:inset-auto md:h-auto w-[min(88vw,360px)] md:w-auto flex-col border border-[#cfc8bc] bg-[#f8f5ef] md:min-h-0`}>
                        <div className="h-[58px] shrink-0 border-b border-[#cfc8bc] flex items-center justify-between px-4 sm:px-5">
                            <div>
                                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8d887f]">LIVE ROOM</p>
                                <h2 className="font-[Georgia,'Times_New_Roman',serif] text-xl">Chat</h2>
                            </div>
                            <button onClick={() => setChatOpen(false)} className="md:hidden text-xs text-[#777168]">Close</button>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3">
                            {chat.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-center">
                                    <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#9a958c] max-w-[190px] leading-5">
                                        Start the conversation. Everyone in the room sees it live.
                                    </p>
                                </div>
                            ) : (
                                chat.map((value, index) => {
                                    const split = value.indexOf(" : ");
                                    const username = split === -1 ? "" : value.slice(0, split);
                                    const message = split === -1 ? value : value.slice(split + 3);
                                    return (
                                        <div key={index} className="border-b border-[#ded8ce] pb-3">
                                            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#8d887f] mb-1">{username}</p>
                                            <p className="text-sm leading-5 break-words">{message}</p>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="border-t border-[#cfc8bc] p-4">
                            {typingUsers.length > 0 && (
                                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#8d887f] mb-2">
                                    {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
                                </p>
                            )}
                            <div className="flex gap-2">
                                <input
                                    value={msg}
                                    onChange={(e) => handleTyping(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") Send();
                                    }}
                                    placeholder="Write a message"
                                    className="min-w-0 flex-1 bg-transparent border-b border-[#bdb6aa] px-1 py-2 text-sm outline-none focus:border-[#20212b] placeholder:text-[#a6a096]"
                                />
                                <button
                                    onClick={Send}
                                    disabled={!socket || !msg.trim()}
                                    className="shrink-0 border border-[#20212b] px-3 py-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#20212b] hover:text-[#f8f5ef] transition-colors"
                                    aria-label="Send message"
                                >
                                    <Icon name="send" size={16} />
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>

                <div className="md:hidden absolute left-6 right-6 bottom-5 flex items-center justify-between border-t border-[#cfc8bc] pt-3 bg-[#f4f0e8]">
                    <div className="flex items-center gap-3 text-xs">
                        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#8d887f]">{members.length} members</span>
                        <span className="text-[#c0b9ae]">/</span>
                        <span className="truncate max-w-[130px]">Leader: {leader}</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={Leave} className="border border-[#cfc8bc] px-3 py-2 text-[10px] uppercase tracking-wider">Leave</button>
                        {isLeader && <button onClick={sendDelete} className="border border-[#b8a8a0] text-[#8b4039] px-3 py-2 text-[10px] uppercase tracking-wider">Delete</button>}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Room;
