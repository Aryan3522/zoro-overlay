const { Server } = require("socket.io");
const overlay = require("../services/overlay.store");

let io;

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log(`[Socket.IO] Client connected: ${socket.id}`);
        
        // send current overlay state to newly connected clients
        socket.emit("overlay", overlay);

        socket.on("disconnect", () => {
            console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
        });
    });
};

const broadcastOverlay = () => {
    if (io) {
        io.emit("overlay", overlay);
    }
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io is not initialized!");
    }
    return io;
};

module.exports = {
    initializeSocket,
    broadcastOverlay,
    getIO
};
