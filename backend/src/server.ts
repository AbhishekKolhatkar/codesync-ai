import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Room from './models/Room.js';
import Problem from './models/Problem.js';
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
        java: { lang: "java", versionIndex: "4" },
        cpp: { lang: "cpp", versionIndex: "5" },
        csharp: { lang: "csharp", versionIndex: "4" },
        go: { lang: "go", versionIndex: "4" },
        rust: { lang: "rust", versionIndex: "4" },
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

// --- NEW ROUTE: Get all problems ---
app.get('/api/problems', async (req, res) => {
    try {
        const problems = await Problem.find({}, 'id title difficulty topics');
        res.json(problems);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch problems" });
    }
});

// --- NEW ROUTE: Get a single problem by ID ---
app.get('/api/problems/:id', async (req, res) => {
    try {
        const problem = await Problem.findOne({ id: req.params.id });
        if (!problem) {
            return res.status(404).json({ error: "Problem not found" });
        }
        res.json(problem);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch problem details" });
    }
});

// --- NEW ROUTE: Submit code to JDoodle against Test Cases ---
app.post('/api/problems/:id/submit', async (req, res) => {
    const { id } = req.params;
    const { code, language } = req.body;

    try {
        const problem = await Problem.findOne({ id });
        if (!problem) return res.status(404).json({ error: "Problem not found" });

        // Currently, we only support JS for structured execution in this implementation
        if (language !== 'javascript') {
            return res.status(400).json({ error: "Only Javascript is currently supported for automated test submissions." });
        }

        const testCases = problem.testCases || [];

        // Dynamically build a JS script that executes their code and evaluates against the DB
        let wrapperScript = `${code}\n\n`;
        wrapperScript += `const __testCases = ${JSON.stringify(testCases)};\n`;
        wrapperScript += `const __results = [];\n`;
        wrapperScript += `for (let i = 0; i < __testCases.length; i++) {\n`;
        wrapperScript += `  const tc = __testCases[i];\n`;
        wrapperScript += `  try {\n`;
        wrapperScript += `    const args = JSON.parse(tc.input);\n`;
        // Hardcode function names for these specific Dummy problems:
        if (id === 'two-sum') {
            wrapperScript += `    const actual = twoSum(...args);\n`;
        } else if (id === 'reverse-linked-list') {
            wrapperScript += `    const actual = reverseList(...args);\n`;
        } else {
            wrapperScript += `    const actual = null;\n`;
        }
        wrapperScript += `    const actualStr = JSON.stringify(actual);\n`;
        wrapperScript += `    const passed = actualStr === tc.expectedOutput;\n`;
        wrapperScript += `    __results.push({ passed, actual: actualStr, expected: tc.expectedOutput, input: tc.input });\n`;
        wrapperScript += `  } catch (err) {\n`;
        wrapperScript += `    __results.push({ passed: false, error: err.message, input: tc.input, expected: tc.expectedOutput });\n`;
        wrapperScript += `  }\n`;
        wrapperScript += `}\n`;
        wrapperScript += `console.log(JSON.stringify(__results));\n`;

        const response = await fetch("https://api.jdoodle.com/v1/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                script: wrapperScript,
                language: "nodejs",
                versionIndex: "0",
                clientId: "906f941a3348dcaf73f699e779866c37",
                clientSecret: "e6201c42996d6a0b0cdc3ab797e056e85fa6d739859356c2b636b1f87bbbf200"
            }),
        });

        const data = await response.json();

        if (data.output) {
            try {
                // Try parsing the structured output
                const results = JSON.parse(data.output.trim());
                res.json({ results });
            } catch (e) {
                // If parsing fails, there is a likely SyntaxError or ReferenceError in their base code
                res.json({ error: data.output });
            }
        } else {
            res.status(500).json({ error: data.error || "Failed to execute on JDoodle" });
        }

    } catch (error) {
        console.error("Submission error:", error);
        res.status(500).json({ error: "Internal Server Error during submission" });
    }
});

// --- NEW ROUTE: Produce Progressive Context-Aware AI Hints ---
app.post('/api/problems/:id/hint', async (req, res) => {
    const { id } = req.params;
    const { code, language, hintsUsed } = req.body;

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "AI API key not configured on server." });
    }

    try {
        const problem = await Problem.findOne({ id });
        if (!problem) return res.status(404).json({ error: "Problem not found" });

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let hintInstruction = "";
        if (hintsUsed === 0) {
            hintInstruction = "Provide a gentle, high-level conceptual nudge. Remind them of the problem goal and suggest a data structure or general pattern to think about. DO NOT show any exact code.";
        } else if (hintsUsed === 1) {
            hintInstruction = "Provide a medium-level hint. Point out a logical flaw in their current code or define abstract algorithmic steps (1. do A, 2. do B) they should implement. You can show very minimal syntax examples (e.g. how a map works), but avoid writing the exact solution.";
        } else {
            hintInstruction = "This is their final hint. Provide high detail. Give explicit pseudocode and time/space complexity requirements to get them over the finish line. You can show small code snippets, but avoid just dropping the complete 100% correct script if possible.";
        }

        const prompt = `You are an expert ${language} technical interviewer guiding a candidate.
Problem: ${problem.title}
Difficulty: ${problem.difficulty}
Description: ${problem.description}

User's current code:
${code}

Your Task:
${hintInstruction}
Keep your response extremely supportive, concise, and formatted beautifully in Markdown. Do not repeat the prompt.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        res.json({ hint: response.text() });
    } catch (error) {
        console.error("AI Hint Error:", error);
        res.status(500).json({ error: "Failed to generate AI hint" });
    }
});

// --- NEW ROUTE: Seed dummy problems ---
app.post('/api/seed-problems', async (req, res) => {
    const dummyProblems = [
        {
            id: 'two-sum',
            title: 'Two Sum',
            difficulty: 'Easy',
            description: '<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p><p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.</p>',
            topics: ['Array', 'Hash Table'],
            starterCode: {
                javascript: 'function twoSum(nums, target) {\n    // Write your code here\n}',
                python: 'def twoSum(nums, target):\n    # Write your code here\n    pass',
                cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n    }\n};',
                java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n    }\n}'
            },
            testCases: [
                { input: '[[2, 7, 11, 15], 9]', expectedOutput: '[0,1]' },
                { input: '[[3, 2, 4], 6]', expectedOutput: '[1,2]' },
                { input: '[[3, 3], 6]', expectedOutput: '[0,1]' }
            ]
        },
        {
            id: 'reverse-linked-list',
            title: 'Reverse Linked List',
            difficulty: 'Easy',
            description: '<p>Given the <code>head</code> of a singly linked list, reverse the list, and return <em>the reversed list</em>.</p>',
            topics: ['Linked List', 'Recursion'],
            starterCode: {
                javascript: '/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nvar reverseList = function(head) {\n    \n};',
                python: '# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        pass'
            },
            testCases: [
                { input: '[[1, 2, 3, 4, 5]]', expectedOutput: '[5,4,3,2,1]' },
                { input: '[[1, 2]]', expectedOutput: '[2,1]' },
                { input: '[[]]', expectedOutput: '[]' }
            ]
        }
    ];

    // Generate remaining up to 75 placeholder LC questions with real names
    const realTitles = [
        "Longest Substring Without Repeating Characters", "Longest Palindromic Substring", "Container With Most Water", "3Sum",
        "Remove Nth Node From End of List", "Valid Parentheses", "Merge Two Sorted Lists", "Merge k Sorted Lists",
        "Search in Rotated Sorted Array", "Combination Sum", "Rotate Image", "Group Anagrams", "Maximum Subarray",
        "Spiral Matrix", "Jump Game", "Merge Intervals", "Insert Interval", "Unique Paths", "Climbing Stairs",
        "Set Matrix Zeroes", "Minimum Window Substring", "Word Search", "Decode Ways", "Validate Binary Search Tree",
        "Same Tree", "Binary Tree Level Order Traversal", "Maximum Depth of Binary Tree",
        "Construct Binary Tree from Preorder and Inorder Traversal", "Best Time to Buy and Sell Stock",
        "Binary Tree Maximum Path Sum", "Valid Palindrome", "Longest Consecutive Sequence", "Clone Graph", "Word Break",
        "Linked List Cycle", "Reorder List", "Maximum Product Subarray", "Find Minimum in Rotated Sorted Array",
        "Reverse Bits", "Number of 1 Bits", "House Robber", "Binary Tree Right Side View", "Number of Islands",
        "Course Schedule", "Implement Trie (Prefix Tree)", "Design Add and Search Words Data Structure",
        "Word Search II", "House Robber II", "Contains Duplicate", "Invert Binary Tree", "Kth Smallest Element in a BST",
        "Lowest Common Ancestor of a Binary Search Tree", "Lowest Common Ancestor of a Binary Tree",
        "Product of Array Except Self", "Valid Anagram", "Meeting Rooms", "Meeting Rooms II", "Graph Valid Tree",
        "Missing Number", "Alien Dictionary", "Encode and Decode Strings", "Find Median from Data Stream",
        "Longest Increasing Subsequence", "Coin Change", "Number of Connected Components in an Undirected Graph",
        "Counting Bits", "Top K Frequent Elements", "Sum of Two Integers", "Pacific Atlantic Water Flow",
        "Longest Repeating Character Replacement", "Non-overlapping Intervals", "Serialize and Deserialize BST",
        "Subtree of Another Tree", "Palindromic Substrings", "Longest Common Subsequence"
    ];

    // We already have Two Sum and Reverse Linked List. Add the next 73
    const topicsList = ['Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math', 'Sorting', 'Greedy', 'Depth-First Search', 'Database', 'Breadth-First Search'];
    for (let i = 0; i < 73; i++) {
        const title = realTitles[i] || `LeetCode ${i + 3} (Placeholder)`;
        const kebabId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        dummyProblems.push({
            id: kebabId,
            title: title,
            difficulty: i % 5 === 0 ? 'Hard' : i % 2 === 0 ? 'Medium' : 'Easy',
            description: `<p>This is a description placeholder for <strong>${title}</strong>. Real data should be seeded here.</p>`,
            topics: [topicsList[i % topicsList.length] || 'Array', topicsList[(i + 1) % topicsList.length] || 'Math'],
            starterCode: {
                javascript: 'function solve() {\n    // \n}',
                python: 'def solve():\n    pass'
            },
            testCases: []
        });
    }

    try {
        await Problem.deleteMany({});
        await Problem.insertMany(dummyProblems);
        res.json({ message: "Dummy problems seeded successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to seed problems" });
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
    socket.on('join-room', async ({ roomId, username, problemId }) => {
        socket.join(roomId);
        console.log(`User ${username} joined room: ${roomId}`);
        try {
            let room = await Room.findOne({ roomId });

            if (!room) {
                let initialCode = '// Welcome to CodeSync AI\n// Start typing your code here...';

                // If this is a new room and a problemId is provided, fetch the starter code
                if (problemId) {
                    const problem = await Problem.findOne({ id: problemId });
                    if (problem && problem.starterCode && problem.starterCode.get('javascript')) {
                        // Default to JS starter code for now, user can change language later
                        initialCode = problem.starterCode.get('javascript') || initialCode;
                    }
                }

                room = await Room.create({
                    roomId,
                    code: initialCode,
                    language: 'javascript'
                });
            }

            // Send the saved code from the DB back to the user who just joined
            socket.emit('receive-code', room.code);
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