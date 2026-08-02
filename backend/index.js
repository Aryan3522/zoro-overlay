require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");

const { initializeSocket } = require("./socket/socket");
const overlayRoutes = require("./routes/overlay.routes");
const { startPolling } = require("./services/youtube.service");
// Streamer bot service is available to be called by controllers or other webhooks if needed
const streamerbotService = require("./services/streamerbot.service");

// initialize express
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// initialize socket.io
initializeSocket(server);

// initialize routes
app.use("/", overlayRoutes);

// initialize services (YouTube Polling)
startPolling();
// Streamer.bot service doesn't require active polling, it's a listener/helper service used via POST /overlay

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`[Server] Backend running on port ${PORT}`);
});
