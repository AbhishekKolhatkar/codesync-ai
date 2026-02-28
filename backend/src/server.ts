import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Room from './models/Room.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ override: true });

const app = express();
const server = http.createServer(app);

// Enable CORS for your frontend
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST']
}));

// MUST ADD THIS: Tells Express to parse incoming JSON payloads
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/codesync';

mongoose.connect(MONGO_URI)
    .then(() => console.log('📦 Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

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

app.post('/ai-review', async (req, res) => {
    const { code, language } = req.body;

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "AI API key not configured on server." });
    }

    try {
        // Initialize the Gemini AI client
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Construct the prompt
        const prompt = `You are an expert ${language} developer and technical interviewer. 
    Review the following code. Identify any bugs, suggest optimizations, and explain your reasoning clearly and concisely.
    
    Code to review:
    \n\n${code}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        res.json({ review: response.text() });
    } catch (error) {
        console.error("AI Review Error:", error);
        res.status(500).json({ error: "Failed to generate AI review" });
    }
});
// -----------------------------------------------

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://codesync-ai-coral.vercel.app'
];

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // 1. Listen for a user joining a specific room
    socket.on('join-room', async ({ roomId, username }) => {
        socket.join(roomId);
        console.log(`User ${username} joined room: ${roomId}`);
        try {
            // Check if the room exists in the DB, or create it if it doesn't exist
            // We use findOneAndUpdate with upsert: true to prevent race conditions 
            // (which cause E11000 duplicate key errors if two users join simultaneously)
            const room = await Room.findOneAndUpdate(
                { roomId },
                { $setOnInsert: { roomId } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            // Send the saved code from the DB back to the user who just joined
            if (room) {
                socket.emit('receive-code', room.code);
            }
        } catch (error) {
            console.error("Error joining room:", error);
        }
    });

    // 2. Listen for code changes and broadcast ONLY to that room
    socket.on('code-change', async ({ roomId, code }) => {
        socket.to(roomId).emit('receive-code', code);
        // Save the code to the DB
        await Room.findOneAndUpdate({ roomId }, { code });
    });

    socket.on('disconnect', () => {
        console.log(`User Disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
    console.log(`🚀 CodeSync Server running on http://localhost:${PORT}`);
});