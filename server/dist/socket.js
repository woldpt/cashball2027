"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIo = getIo;
exports.setupSocket = setupSocket;
const socket_io_1 = require("socket.io");
// This handles the real-time networking described in the README
// - Room joining
// - Tactic submission notifications
// - Match event streaming
let ioInstance;
function getIo() {
    if (!ioInstance)
        throw new Error('Socket.io not initialized yet');
    return ioInstance;
}
function setupSocket(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });
    ioInstance = io;
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);
        // Join a game room
        socket.on('join_room', (roomCode) => {
            socket.join(roomCode);
            console.log(`Socket ${socket.id} joined room ${roomCode}`);
            // Notify others in room
            socket.to(roomCode).emit('user_joined', { id: socket.id });
        });
        // Submitting a tactic
        socket.on('submit_tactic', ({ roomCode, clubId, tactic }) => {
            console.log(`Club ${clubId} submitted tactic in room ${roomCode}`);
            // Update DB
            // Broadcast to room that a player has submitted (visibilidade de submissões)
            io.to(roomCode).emit('tactic_submitted', { clubId });
            // TODO: Check if ALL active human coaches have submitted. If so, trigger simulation!
        });
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
    return io;
}
