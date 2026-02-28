import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);

// Enable CORS for your frontend
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST']
}));

// MUST ADD THIS: Tells Express to parse incoming JSON payloads
app.use(express.json());

// --- NEW ROUTE: Secure proxy for JDoodle API ---
app.post('/execute', async (req, res) => {
    const { language, sourceCode } = req.body;

    const languageMap: Record<string, { lang: string; versionIndex: string }> = {
        javascript: { lang: "nodejs", versionIndex: "0" },
        typescript: { lang: "nodejs", versionIndex: "0" }, // JDoodle runs TS via Node
        python: { lang: "python3", versionIndex: "3" },
    };

    const config = languageMap[language];

    if (!config) {
        return res.status(400).json({ error: "Unsupported language" });
    }

    try {
        // We use Node's native fetch to call JDoodle from the server
        const response = await fetch("https://api.jdoodle.com/v1/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                script: sourceCode,
                language: config.lang,
                versionIndex: config.versionIndex,
                clientId: "906f941a3348dcaf73f699e779866c37",         // Paste your key here
                clientSecret: "e6201c42996d6a0b0cdc3ab797e056e85fa6d739859356c2b636b1f87bbbf200"  // Paste your secret here
            }),
        });

        const data = await response.json();
        // Send the JDoodle response back to our React frontend
        res.json(data);
    } catch (error) {
        console.error("Backend Execution Error:", error);
        res.status(500).json({ error: "Failed to execute code" });
    }
});
// -----------------------------------------------

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // 1. Listen for a user joining a specific room
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);
    });

    // 2. Listen for code changes and broadcast ONLY to that room
    socket.on('code-change', ({ roomId, code }) => {
        socket.to(roomId).emit('receive-code', code);
    });

    socket.on('disconnect', () => {
        console.log(`User Disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
    console.log(`🚀 CodeSync Server running on http://localhost:${PORT}`);
});