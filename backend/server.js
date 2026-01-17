// Quiz AI App - Node.js Server with Socket.IO for Multiplayer
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const cookieParser = require('cookie-parser');
// Load environment variables from .env for local development
require('dotenv').config();

// Gemini API key should be provided via environment variable for security.
// Set the environment variable GEMINI_API_KEY in production (do NOT commit keys).
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyANt9WI56zqzUfP3M0p2gsLMkUfbFbUeWw';

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: [
            'http://localhost:3000',
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            'http://localhost:5000',
            'http://localhost:8000',
            'http://localhost:8001',
            'https://your-frontend-domain.netlify.app', // Update this with your actual frontend URL
            'https://your-frontend-domain.vercel.app',  // Update this with your actual frontend URL
            /\.netlify\.app$/,
            /\.vercel\.app$/,
            /\.github\.io$/
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Configure multer for file uploads
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit for larger documents
    }
});

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:5000',
        'http://localhost:8000',
        'http://localhost:8001',
        'https://your-frontend-domain.netlify.app', // Update this with your actual frontend URL
        'https://your-frontend-domain.vercel.app',  // Update this with your actual frontend URL
        /\.netlify\.app$/,
        /\.vercel\.app$/,
        /\.github\.io$/
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname)));

// In-memory storage for quiz rooms
const rooms = new Map();

// Generate random 6-digit PIN
function generatePin() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Gemini API functions
async function generateQuizFromTopic(topic, questionCount, difficulty = 'intermediate') {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE' || GEMINI_API_KEY.startsWith('ghp_')) {
        // Return mock data for testing when API key is not properly configured
        console.log('Using mock data for quiz generation - configure a valid Gemini API key for real functionality');
        return generateMockQuiz(topic, questionCount, difficulty);
    }
    
    const difficultyPrompts = {
        beginner: "Create BEGINNER level questions focusing on basic concepts, definitions, and fundamental principles. Use straightforward language and avoid complex scenarios.",
        intermediate: "Create INTERMEDIATE level questions that require moderate understanding and application of concepts. Include some analytical thinking.",
        advanced: "Create ADVANCED level questions requiring deep understanding, analysis, and application. Include complex scenarios and multi-step reasoning.",
        expert: "Create EXPERT level questions that are challenging and require specialized knowledge, critical thinking, synthesis, and advanced problem-solving skills."
    };
    
    const prompt = `Generate ${questionCount} multiple-choice quiz questions about "${topic}". 
    
    DIFFICULTY LEVEL: ${difficultyPrompts[difficulty]}
    
    CREATIVITY REQUIREMENTS:
    - Make questions engaging and thought-provoking
    - Use real-world scenarios and practical applications when possible
    - Include creative distractors (wrong answers) that are plausible but clearly incorrect
    - Vary question types: definitions, applications, comparisons, problem-solving, scenarios
    - Use interesting examples and case studies
    - Make options witty but educational where appropriate
    - Keep answer options CONCISE (maximum 5-7 words each)
    - Use short phrases instead of full sentences for options
    
    Each question should have exactly 4 answer options (A, B, C, D) with only one correct answer.
    CRITICAL: Distribute correct answers randomly across ALL options (A, B, C, D). Avoid patterns.
    Ensure roughly equal distribution: 25% A, 25% B, 25% C, 25% D across all questions.
    Make the incorrect options creative and educational - they should teach something even when wrong.
    IMPORTANT: Keep all answer options SHORT and CONCISE (5-7 words maximum).
    
    Format the response as a JSON array with this structure:
    [
        {
            "question": "Question text here?",
            "options": {
                "A": "Creative option A text",
                "B": "Creative option B text", 
                "C": "Creative option C text",
                "D": "Creative option D text"
            },
            "correct": "A"
        }
    ]
    
    Make sure the questions are educational, varied in difficulty within the ${difficulty} level, and cover different aspects of the topic with creative scenarios.`;
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error Response (Topic):', response.status, errorText);
            throw new Error(`Failed to generate quiz from Gemini API: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        
        // Extract JSON from the response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const questions = JSON.parse(jsonMatch[0]);
            return shuffleAnswers(questions);
        } else {
            throw new Error('Invalid response format from Gemini API');
        }
    } catch (error) {
        console.error('Error generating quiz:', error);
        console.log('Falling back to mock data due to API error');
        // Fallback to mock data if API fails
        return generateMockQuiz(topic, questionCount, difficulty);
    }
}

async function generateQuizFromDocument(fileContent, questionCount, difficulty = 'intermediate') {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE' || GEMINI_API_KEY.startsWith('ghp_')) {
        // Return mock data for testing when API key is not properly configured
        console.log('Using mock data for document quiz generation - configure a valid Gemini API key for real functionality');
        return generateMockDocumentQuiz(fileContent, questionCount, difficulty);
    }

    // Analyze document structure and extract sections
    const documentAnalysis = analyzeDocumentStructure(fileContent);
    
    const difficultyPrompts = {
        beginner: "Create BEGINNER level questions focusing on basic facts, main ideas, and simple comprehension from each specific section. Use clear, straightforward questions.",
        intermediate: "Create INTERMEDIATE level questions requiring understanding, analysis, and connection of ideas from specific sections. Include some inferential thinking.",
        advanced: "Create ADVANCED level questions requiring deep analysis, synthesis of information, and critical evaluation from different parts of the document.",
        expert: "Create EXPERT level questions that require sophisticated analysis, critical thinking, synthesis across concepts, and advanced interpretation from various document sections."
    };
    
    const prompt = `Analyze this document and create ${questionCount} multiple-choice quiz questions that cover DIFFERENT SECTIONS and topics within the document.

    DOCUMENT ANALYSIS REQUIREMENTS:
    1. **SECTION-BASED QUESTIONS**: Identify different sections, chapters, topics, or themes in the document
    2. **DIVERSE COVERAGE**: Ensure questions cover various parts - don't focus on just one area
    3. **SPECIFIC CONTENT**: Ask about actual content from each section, not generic document questions
    4. **AVOID GENERIC QUESTIONS**: Don't ask "What is this document about?" or "Who wrote this?"
    5. **TARGET SPECIFIC DETAILS**: Focus on facts, concepts, examples, and ideas from different sections

    DIFFICULTY LEVEL: ${difficultyPrompts[difficulty]}

    SECTION DISTRIBUTION STRATEGY:
    - If the document has clear sections/chapters: Create questions from each major section
    - If it's a continuous text: Break into beginning, middle, end portions and create questions from each
    - For complex documents: Focus on different topics, concepts, or themes mentioned
    - Ensure NO TWO QUESTIONS come from the exact same paragraph or section

    QUESTION QUALITY REQUIREMENTS:
    - Test comprehension of SPECIFIC content, not document structure
    - Ask about facts, details, examples, and concepts from different parts
    - Use in-depth analysis of the actual subject matter
    - Create questions that show someone actually read and understood each section
    - Avoid meta-questions about the document itself

    CREATIVITY REQUIREMENTS:
    - Create engaging questions that test real understanding of each section's content
    - Use scenarios and applications based on specific content from different parts
    - Include creative distractors that are plausible but clearly wrong
    - Vary question types: comprehension, analysis, inference, application from different sections
    - Keep answer options CONCISE (maximum 5-7 words each)

    Each question should have exactly 4 answer options (A, B, C, D) with only one correct answer.
    CRITICAL: Distribute correct answers randomly across ALL options (A, B, C, D). Avoid patterns.
    Ensure roughly equal distribution: 25% A, 25% B, 25% C, 25% D across all questions.
    IMPORTANT: Keep all answer options SHORT and CONCISE (5-7 words maximum).

    Document content:
    ${fileContent}

    ${documentAnalysis.sections.length > 1 ? 
        `\nIDENTIFIED SECTIONS: Create questions covering these different areas:
        ${documentAnalysis.sections.map((section, index) => `${index + 1}. ${section.title} (${section.wordCount} words)`).join('\n        ')}` : 
        `\nDIVERSE TOPICS: Ensure questions cover different topics and themes throughout the document.`}

    Format the response as a JSON array with this structure:
    [
        {
            "question": "Question text here?",
            "options": {
                "A": "Creative option A text",
                "B": "Creative option B text", 
                "C": "Creative option C text",
                "D": "Creative option D text"
            },
            "correct": "A",
            "section": "Section/Topic this question covers"
        }
    ]`;
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error Response (Document):', response.status, errorText);
            throw new Error(`Failed to generate quiz from Gemini API: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        
        console.log(`📚 Document Analysis: Found ${documentAnalysis.sections.length} sections`);
        documentAnalysis.sections.forEach((section, index) => {
            console.log(`   ${index + 1}. ${section.title} (${section.wordCount} words)`);
        });
        
        // Extract JSON from the response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const questions = JSON.parse(jsonMatch[0]);
            console.log(`✅ Generated ${questions.length} questions from different document sections`);
            return shuffleAnswers(questions);
        } else {
            throw new Error('Invalid response format from Gemini API');
        }
    } catch (error) {
        console.error('Error generating quiz from document:', error);
        console.log('Falling back to mock data due to API error');
        // Fallback to mock data if API fails
        return generateMockDocumentQuiz(fileContent, questionCount, difficulty);
    }
}

// Analyze document structure to identify sections and topics
function analyzeDocumentStructure(content) {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const sections = [];
    
    // Look for section indicators (headers, chapters, numbered sections, etc.)
    const sectionPatterns = [
        /^(chapter\s+\d+|ch\s*\d+)/i,           // Chapter 1, Ch 1
        /^(section\s+\d+|sec\s*\d+)/i,          // Section 1, Sec 1
        /^(part\s+\d+)/i,                        // Part 1
        /^\d+\.\s*[A-Z]/,                        // 1. Title
        /^[A-Z][^.]{10,80}$/,                    // Potential headers (all caps or title case)
        /^#{1,6}\s+/,                            // Markdown headers
        /^[A-Z\s]{5,50}$/,                       // ALL CAPS headers
        /^(introduction|preface|conclusion|summary|overview|background)/i, // Common sections
        /^(abstract|methodology|results|discussion|references|bibliography)/i
    ];
    
    let currentSection = {
        title: 'Introduction',
        startLine: 0,
        content: '',
        wordCount: 0
    };
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Check if this line is a section header
        let isHeader = false;
        for (const pattern of sectionPatterns) {
            if (pattern.test(line)) {
                isHeader = true;
                break;
            }
        }
        
        // Also check for lines that look like headers (short, capitalized, etc.)
        if (!isHeader && line.length < 80 && line.length > 5) {
            const words = line.split(' ');
            const capitalizedWords = words.filter(word => 
                word.length > 2 && (word[0] === word[0].toUpperCase() || word === word.toUpperCase())
            );
            
            if (capitalizedWords.length / words.length > 0.6) {
                isHeader = true;
            }
        }
        
        if (isHeader && currentSection.content.trim().length > 100) {
            // Save current section and start new one
            currentSection.wordCount = currentSection.content.split(' ').length;
            sections.push({ ...currentSection });
            
            currentSection = {
                title: line.substring(0, 100), // Limit title length
                startLine: i,
                content: '',
                wordCount: 0
            };
        } else {
            currentSection.content += line + ' ';
        }
    }
    
    // Add the last section
    if (currentSection.content.trim().length > 100) {
        currentSection.wordCount = currentSection.content.split(' ').length;
        sections.push(currentSection);
    }
    
    // If no sections found, create artificial sections by splitting content
    if (sections.length === 0) {
        const totalWords = content.split(' ').length;
        const wordsPerSection = Math.ceil(totalWords / 3);
        const words = content.split(' ');
        
        for (let i = 0; i < 3; i++) {
            const startIndex = i * wordsPerSection;
            const endIndex = Math.min((i + 1) * wordsPerSection, words.length);
            const sectionWords = words.slice(startIndex, endIndex);
            
            if (sectionWords.length > 50) { // Minimum section size
                sections.push({
                    title: `Section ${i + 1}`,
                    startLine: 0,
                    content: sectionWords.join(' '),
                    wordCount: sectionWords.length
                });
            }
        }
    }
    
    return {
        sections: sections,
        totalSections: sections.length,
        averageWordsPerSection: sections.reduce((sum, s) => sum + s.wordCount, 0) / sections.length
    };
}

// Shuffle answer options to randomize correct answer position
function shuffleAnswers(questions) {
    return questions.map(question => {
        // Get all option entries and the correct answer text
        const options = Object.entries(question.options);
        const correctAnswerText = question.options[question.correct];
        
        // Shuffle the options using Fisher-Yates algorithm
        const shuffledOptions = [...options];
        for (let i = shuffledOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
        }
        
        // Create new options object with A, B, C, D keys in order
        const newOptions = {};
        const keys = ['A', 'B', 'C', 'D'];
        let newCorrectKey = '';
        
        shuffledOptions.forEach(([originalKey, value], index) => {
            newOptions[keys[index]] = value;
            if (value === correctAnswerText) {
                newCorrectKey = keys[index];
            }
        });
        
        return {
            ...question,
            options: newOptions,
            correct: newCorrectKey
        };
    });
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        apiKey: GEMINI_API_KEY ? 'configured' : 'missing'
    });
});

// -----------------------------
// Database and Authentication Setup
// -----------------------------
const crypto = require('crypto');
const { MongoClient } = require('mongodb');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://braniaclearning:Braniac@google_2025@braniac.uleylmt.mongodb.net/?appName=Braniac';
const DB_NAME = process.env.DB_NAME || 'braniac_db';
let db;
let usersCollection;
let sessionsCollection;
let userDataCollection; // New collection for user progress data
// In-memory fallback stores when MongoDB is not available
const inMemoryUsers = new Map(); // username -> user object
const inMemorySessions = new Map(); // token -> { token, username, createdAt }
const inMemoryUserData = new Map(); // username -> user data (scores, achievements, progress)

// Connect to MongoDB
async function connectDB() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        usersCollection = db.collection('users');
        sessionsCollection = db.collection('sessions');
        userDataCollection = db.collection('userData');
        
        // Create indexes for faster lookups
        await usersCollection.createIndex({ username: 1 }, { unique: true });
        await sessionsCollection.createIndex({ token: 1 }, { unique: true });
        await sessionsCollection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 604800 }); // 7 days
        await userDataCollection.createIndex({ username: 1 }, { unique: true });
        
        console.log('✅ Connected to MongoDB successfully');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        console.log('⚠️  Running without database - using in-memory fallback (auth will not persist across restarts)');
    }
}

// Start DB connection
connectDB();

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

function validateUsername(username) {
    // Allow letters, numbers, hyphens and underscores, no spaces
    return typeof username === 'string' && /^[A-Za-z0-9_-]{3,30}$/.test(username);
}

function validateFirstName(firstName) {
    // Allow letters, spaces and hyphens only
    return typeof firstName === 'string' && /^[A-Za-z\s-]{1,50}$/.test(firstName);
}

function validatePassword(password) {
    // No spaces, at least 8 characters
    return typeof password === 'string' && password.length >= 8 && !/\s/.test(password);
}

function hashPassword(password, salt) {
    return crypto.scryptSync(password, salt, 64).toString('hex');
}

function createSessionToken(username) {
    const token = crypto.createHmac('sha256', SESSION_SECRET)
        .update(username + ':' + Date.now() + ':' + crypto.randomBytes(16).toString('hex'))
        .digest('hex');
    return token;
}

async function saveSession(token, username) {
    if (sessionsCollection) {
        try {
            await sessionsCollection.insertOne({
                token,
                username,
                createdAt: new Date()
            });
            return;
        } catch (err) {
            console.error('Error saving session to DB:', err);
        }
    }
    // Fallback to in-memory
    try {
        inMemorySessions.set(token, { token, username, createdAt: new Date() });
    } catch (err) {
        console.error('Error saving session in-memory:', err);
    }
}

async function getSession(token) {
    if (sessionsCollection) {
        try {
            return await sessionsCollection.findOne({ token });
        } catch (err) {
            console.error('Error getting session from DB:', err);
        }
    }
    // Fallback to in-memory
    try {
        const s = inMemorySessions.get(token) || null;
        if (s) {
            console.log('Retrieved in-memory session for', s.username);
        } else {
            console.log('No in-memory session for token', token && token.slice ? token.slice(0,8) : token);
        }
        return s;
    } catch (err) {
        console.error('Error getting session in-memory:', err);
        return null;
    }
}

async function deleteSession(token) {
    if (sessionsCollection) {
        try {
            await sessionsCollection.deleteOne({ token });
        } catch (err) {
            console.error('Error deleting session from DB:', err);
        }
    }
    // Fallback to in-memory
    try {
        inMemorySessions.delete(token);
    } catch (err) {
        console.error('Error deleting in-memory session:', err);
    }
}

// User Data Management Functions
async function getUserData(username) {
    if (userDataCollection) {
        try {
            const data = await userDataCollection.findOne({ username });
            return data || null;
        } catch (err) {
            console.error('Error getting user data from DB:', err);
        }
    }
    // Fallback to in-memory
    return inMemoryUserData.get(username) || null;
}

async function saveUserData(username, data) {
    const userData = {
        username,
        scores: data.scores || [],
        achievements: data.achievements || [],
        totalPoints: data.totalPoints || 0,
        questionsAnswered: data.questionsAnswered || 0,
        correctAnswers: data.correctAnswers || 0,
        quizzesTaken: data.quizzesTaken || 0,
        currentStreak: data.currentStreak || 0,
        longestStreak: data.longestStreak || 0,
        lastQuizDate: data.lastQuizDate || null,
        profilePicture: data.profilePicture || 'assets/icons/guest.svg',
        bio: data.bio || '',
        updatedAt: new Date()
    };

    if (userDataCollection) {
        try {
            await userDataCollection.updateOne(
                { username },
                { $set: userData },
                { upsert: true }
            );
            return true;
        } catch (err) {
            console.error('Error saving user data to DB:', err);
        }
    }
    // Fallback to in-memory
    inMemoryUserData.set(username, userData);
    return true;
}

async function updateUserScore(username, scoreData) {
    let userData = await getUserData(username) || {
        scores: [],
        achievements: [],
        totalPoints: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        quizzesTaken: 0,
        currentStreak: 0,
        longestStreak: 0
    };

    // Add new score
    userData.scores = userData.scores || [];
    userData.scores.push({
        topic: scoreData.topic,
        score: scoreData.score,
        totalQuestions: scoreData.totalQuestions,
        correctAnswers: scoreData.correctAnswers,
        difficulty: scoreData.difficulty,
        date: new Date(),
        timeSpent: scoreData.timeSpent || 0
    });

    // Update stats
    userData.totalPoints = (userData.totalPoints || 0) + scoreData.score;
    userData.questionsAnswered = (userData.questionsAnswered || 0) + scoreData.totalQuestions;
    userData.correctAnswers = (userData.correctAnswers || 0) + scoreData.correctAnswers;
    userData.quizzesTaken = (userData.quizzesTaken || 0) + 1;

    // Update streak
    const today = new Date().toDateString();
    const lastDate = userData.lastQuizDate ? new Date(userData.lastQuizDate).toDateString() : null;
    
    if (lastDate === today) {
        // Same day, don't change streak
    } else {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (lastDate === yesterday) {
            userData.currentStreak = (userData.currentStreak || 0) + 1;
        } else {
            userData.currentStreak = 1;
        }
        userData.longestStreak = Math.max(userData.longestStreak || 0, userData.currentStreak);
    }
    userData.lastQuizDate = new Date();

    await saveUserData(username, userData);
    return userData;
}

// Register route
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, firstName, password, confirmPassword } = req.body || {};

        if (!username || !firstName || !password || !confirmPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!validateUsername(username)) {
            return res.status(400).json({ error: 'Invalid username. Use letters, numbers, hyphens or underscores (3-30 chars), no spaces.' });
        }

        if (!validateFirstName(firstName)) {
            return res.status(400).json({ error: 'Invalid first name. Use letters, spaces, and hyphens only.' });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ error: 'Invalid password. Minimum 8 chars, no spaces.' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        const normalized = username.toLowerCase();

        // Check if user exists in DB or in-memory
        let existingUser = null;
        if (usersCollection) {
            existingUser = await usersCollection.findOne({ username: normalized });
        } else if (inMemoryUsers.has(normalized)) {
            existingUser = inMemoryUsers.get(normalized);
        }
        if (existingUser) {
            return res.status(409).json({ error: 'Username already taken' });
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = hashPassword(password, salt);

        const user = { 
            username: normalized, 
            firstName: firstName.trim(), 
            passwordHash, 
            salt, 
            createdAt: new Date() 
        };

        // Save user to DB or in-memory
        if (usersCollection) {
            try {
                await usersCollection.insertOne(user);
            } catch (err) {
                console.error('Error inserting user to DB:', err);
                return res.status(500).json({ error: 'Server error' });
            }
        } else {
            inMemoryUsers.set(normalized, user);
        }

        const token = createSessionToken(normalized);
        await saveSession(token, normalized);

        // Set HttpOnly cookie
        res.cookie('session', token, { httpOnly: true, sameSite: 'lax' });

        return res.json({ ok: true, user: { username: user.username, firstName: user.firstName } });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Login route
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body || {};

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const normalized = username.toLowerCase();

        // Find user in DB or in-memory
        let user = null;
        if (usersCollection) {
            user = await usersCollection.findOne({ username: normalized });
        } else if (inMemoryUsers.has(normalized)) {
            user = inMemoryUsers.get(normalized);
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const candidateHash = hashPassword(password, user.salt);
        if (!crypto.timingSafeEqual(Buffer.from(candidateHash, 'hex'), Buffer.from(user.passwordHash, 'hex'))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = createSessionToken(normalized);
        await saveSession(token, normalized);
        res.cookie('session', token, { httpOnly: true, sameSite: 'lax' });

        return res.json({ ok: true, user: { username: user.username, firstName: user.firstName } });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Simple middleware to get current user from session cookie or header
async function getUserFromRequest(req) {
    const token = req.cookies && req.cookies.session || req.headers['authorization'] && req.headers['authorization'].replace('Bearer ', '');
    if (!token) {
        console.log('No session token found on request');
        return null;
    }
    console.log('getUserFromRequest token startsWith:', token && token.slice ? token.slice(0,8) : token);
    
    const session = await getSession(token);
    if (!session) return null;
    
    if (usersCollection) {
        const user = await usersCollection.findOne({ username: session.username });
        return user || null;
    }
    // Fallback to in-memory users
    try {
        const memUser = inMemoryUsers.get(session.username) || null;
        if (memUser) return memUser;
    } catch (err) {
        console.error('Error reading in-memory user:', err);
    }
    return null;
}

// Logout route
app.post('/api/auth/logout', async (req, res) => {
    const token = req.cookies && req.cookies.session;
    if (token) {
        await deleteSession(token);
    }
    res.clearCookie('session');
    return res.json({ ok: true, message: 'Logged out successfully' });
});

// Get current user route (check if logged in)
app.get('/api/auth/me', async (req, res) => {
    const user = await getUserFromRequest(req);
    if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get user data along with basic info
    const userData = await getUserData(user.username);
    
    return res.json({ 
        ok: true, 
        user: { 
            username: user.username, 
            firstName: user.firstName 
        },
        userData: userData || {
            scores: [],
            achievements: [],
            totalPoints: 0,
            questionsAnswered: 0,
            correctAnswers: 0,
            quizzesTaken: 0,
            currentStreak: 0,
            longestStreak: 0,
            profilePicture: 'assets/icons/guest.svg',
            bio: ''
        }
    });
});

// Get user data
app.get('/api/user/data', async (req, res) => {
    try {
        const user = await getUserFromRequest(req);
        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const userData = await getUserData(user.username);
        if (!userData) {
            return res.json({
                ok: true,
                data: {
                    scores: [],
                    achievements: [],
                    totalPoints: 0,
                    questionsAnswered: 0,
                    correctAnswers: 0,
                    quizzesTaken: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                    profilePicture: 'assets/icons/guest.svg',
                    bio: ''
                }
            });
        }

        return res.json({ ok: true, data: userData });
    } catch (err) {
        console.error('Error getting user data:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Save/Update user data
app.post('/api/user/data', async (req, res) => {
    try {
        const user = await getUserFromRequest(req);
        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { data } = req.body;
        if (!data) {
            return res.status(400).json({ error: 'Data is required' });
        }

        await saveUserData(user.username, data);
        return res.json({ ok: true, message: 'Data saved successfully' });
    } catch (err) {
        console.error('Error saving user data:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Submit quiz score
app.post('/api/user/score', async (req, res) => {
    try {
        const user = await getUserFromRequest(req);
        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { topic, score, totalQuestions, correctAnswers, difficulty, timeSpent } = req.body;
        
        if (topic === undefined || score === undefined || totalQuestions === undefined || correctAnswers === undefined) {
            return res.status(400).json({ error: 'Missing required score data' });
        }

        const updatedData = await updateUserScore(user.username, {
            topic,
            score,
            totalQuestions,
            correctAnswers,
            difficulty: difficulty || 'intermediate',
            timeSpent: timeSpent || 0
        });

        return res.json({ ok: true, data: updatedData });
    } catch (err) {
        console.error('Error saving score:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Update user achievements
app.post('/api/user/achievements', async (req, res) => {
    try {
        const user = await getUserFromRequest(req);
        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { achievements } = req.body;
        if (!Array.isArray(achievements)) {
            return res.status(400).json({ error: 'Achievements must be an array' });
        }

        let userData = await getUserData(user.username) || {};
        userData.achievements = achievements;
        await saveUserData(user.username, userData);

        return res.json({ ok: true, message: 'Achievements updated' });
    } catch (err) {
        console.error('Error updating achievements:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Update user profile
app.post('/api/user/profile', async (req, res) => {
    try {
        const user = await getUserFromRequest(req);
        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { profilePicture, bio } = req.body;
        
        let userData = await getUserData(user.username) || {};
        if (profilePicture !== undefined) userData.profilePicture = profilePicture;
        if (bio !== undefined) userData.bio = bio;
        
        await saveUserData(user.username, userData);

        return res.json({ ok: true, message: 'Profile updated' });
    } catch (err) {
        console.error('Error updating profile:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Favicon route - return 204 No Content (no favicon for API server)
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API Routes for quiz generation
app.post('/api/generate-quiz/topic', async (req, res) => {
    try {
        const { topic, questionCount, difficulty } = req.body;
        
        if (!topic || !questionCount) {
            return res.status(400).json({ error: 'Topic and question count are required' });
        }
        
        console.log(`Generating quiz for topic: ${topic}, questions: ${questionCount}, difficulty: ${difficulty || 'intermediate'}`);
        const questions = await generateQuizFromTopic(topic, questionCount, difficulty);
        
        res.json({ questions });
    } catch (error) {
        console.error('Error generating topic quiz:', error);
        res.status(500).json({ error: error.message });
    }
});

// Middleware to handle multer errors
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                error: 'File too large. Please upload a file smaller than 50MB.' 
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ 
                error: 'Unexpected file field. Please use the correct file input.' 
            });
        }
        return res.status(400).json({ 
            error: 'File upload error: ' + err.message 
        });
    }
    next(err);
};

app.post('/api/generate-quiz/document', upload.single('document'), handleMulterError, async (req, res) => {
    try {
        const { questionCount, difficulty } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'Document file is required' });
        }
        
        if (!questionCount) {
            return res.status(400).json({ error: 'Question count is required' });
        }
        
        // Extract text from uploaded file
        let fileContent;
        const fileExtension = req.file.originalname.toLowerCase().split('.').pop();
        
        try {
            if (fileExtension === 'txt') {
                fileContent = req.file.buffer.toString('utf-8');
            } else if (fileExtension === 'pdf') {
                console.log('Processing PDF file...');
                const pdfData = await pdfParse(req.file.buffer);
                fileContent = pdfData.text;
                console.log(`Extracted ${fileContent.length} characters from PDF`);
            } else {
                return res.status(400).json({ 
                    error: 'Unsupported file type. Please upload a TXT or PDF file.' 
                });
            }
            
            if (!fileContent || fileContent.trim().length === 0) {
                return res.status(400).json({ 
                    error: 'The uploaded file appears to be empty or unreadable. Please ensure it contains text content.' 
                });
            }
            
            // Clean up the extracted text
            fileContent = fileContent.replace(/\s+/g, ' ').trim();
            
        } catch (error) {
            console.error('Error processing file:', error);
            return res.status(400).json({ 
                error: 'Error processing the uploaded file. Please ensure it is a valid TXT or PDF file with readable content.' 
            });
        }
        
        console.log(`Generating quiz from document: ${req.file.originalname}, questions: ${questionCount}, difficulty: ${difficulty || 'intermediate'}`);
        console.log(`Document content length: ${fileContent.length} characters`);
        const questions = await generateQuizFromDocument(fileContent, questionCount, difficulty);
        
        res.json({ questions });
    } catch (error) {
        console.error('Error generating document quiz:', error);
        res.status(500).json({ error: error.message });
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Create a new quiz room
    socket.on('createRoom', (data) => {
        const pin = generatePin();
        const room = {
            pin: pin,
            host: socket.id,
            questions: data.questions,
            timeLimit: data.timeLimit || 0,
            players: [{
                id: socket.id,
                name: 'Host',
                isHost: true,
                score: 0
            }],
            isStarted: false,
            results: []
        };
        
        rooms.set(pin, room);
        socket.join(pin);
        
        console.log(`Room created with PIN: ${pin}, Time Limit: ${data.timeLimit || 'No limit'}`);
        socket.emit('roomCreated', { pin: pin });
        socket.emit('playerJoined', { players: room.players });
    });
    
    // Join an existing quiz room
    socket.on('joinRoom', (data) => {
        const { pin, name } = data;
        const room = rooms.get(pin);
        
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        
        if (room.isStarted) {
            socket.emit('error', { message: 'Quiz has already started' });
            return;
        }
        
        // Check if name already exists
        const nameExists = room.players.some(player => player.name.toLowerCase() === name.toLowerCase());
        if (nameExists) {
            socket.emit('error', { message: 'Name already taken' });
            return;
        }
        
        // Add player to room
        const player = {
            id: socket.id,
            name: name,
            isHost: false,
            score: 0
        };
        
        room.players.push(player);
        socket.join(pin);
        
        console.log(`Player ${name} joined room ${pin}`);
        socket.emit('joinedRoom', { pin: pin, players: room.players });
        
        // Notify all players in the room
        io.to(pin).emit('playerJoined', { players: room.players });
    });
    
    // Start the quiz (host only)
    socket.on('startQuiz', (data) => {
        const { pin } = data;
        const room = rooms.get(pin);
        
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        
        if (room.host !== socket.id) {
            socket.emit('error', { message: 'Only the host can start the quiz' });
            return;
        }
        
        if (room.players.length < 2) {
            socket.emit('error', { message: 'Need at least 2 players to start' });
            return;
        }
        
        room.isStarted = true;
        console.log(`Quiz started in room ${pin}`);
        
        // Send quiz questions and timer settings to all players
        io.to(pin).emit('quizStarted', { 
            questions: room.questions, 
            timeLimit: room.timeLimit 
        });
    });
    
    // Submit quiz score
    socket.on('submitScore', (data) => {
        const { pin, score, total } = data;
        const room = rooms.get(pin);
        
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        
        // Find the player and update their score
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.score = score;
            player.total = total;
            
            // Add to results if not already added
            const existingResult = room.results.find(r => r.id === socket.id);
            if (!existingResult) {
                room.results.push({
                    id: socket.id,
                    name: player.name,
                    score: score,
                    total: total,
                    percentage: Math.round((score / total) * 100)
                });
            }
            
            console.log(`Player ${player.name} submitted score: ${score}/${total}`);
            
            // Check if all players have submitted scores
            if (room.results.length === room.players.length) {
                // Sort results by score (descending)
                room.results.sort((a, b) => b.score - a.score);
                
                console.log(`All players finished quiz in room ${pin}. Sending results.`);
                io.to(pin).emit('quizResults', { results: room.results });
            }
        }
    });
    
    // Handle player disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Find and remove player from any rooms
        for (const [pin, room] of rooms.entries()) {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            
            if (playerIndex !== -1) {
                const player = room.players[playerIndex];
                console.log(`Player ${player.name} left room ${pin}`);
                
                // If host disconnects, close the room
                if (player.isHost) {
                    console.log(`Host left room ${pin}. Closing room.`);
                    io.to(pin).emit('error', { message: 'Host has left the room' });
                    rooms.delete(pin);
                } else {
                    // Remove player and notify others
                    room.players.splice(playerIndex, 1);
                    io.to(pin).emit('playerLeft', { players: room.players });
                }
                break;
            }
        }
    });
    
    // Get room info (for debugging)
    socket.on('getRoomInfo', (data) => {
        const { pin } = data;
        const room = rooms.get(pin);
        
        if (room) {
            socket.emit('roomInfo', {
                pin: room.pin,
                players: room.players,
                isStarted: room.isStarted,
                questionCount: room.questions.length
            });
        } else {
            socket.emit('error', { message: 'Room not found' });
        }
    });
});

// Clean up empty rooms periodically
setInterval(() => {
    const now = Date.now();
    for (const [pin, room] of rooms.entries()) {
        // Remove rooms with no players or rooms older than 1 hour
        if (room.players.length === 0 || (now - room.createdAt) > 3600000) {
            console.log(`Cleaning up room ${pin}`);
            rooms.delete(pin);
        }
    }
}, 300000); // Check every 5 minutes

// Startup environment check
console.log('🔍 Environment Check:');
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('- DB_NAME:', process.env.DB_NAME ? '✅ Set' : '❌ Missing');
console.log('- SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ Set' : '❌ Missing');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');

// Global error handlers for unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise);
    console.error('❌ Reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    console.error('❌ Stack:', error.stack);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Express error handler caught error:');
    console.error('❌ Error:', err.message);
    console.error('❌ Stack:', err.stack);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Export the app for serverless platforms (Vercel)
module.exports = app;

// Start server for Railway and other platforms
if (require.main === module) {
    const PORT = process.env.PORT || 3001;
    const HOST = process.env.HOST || '0.0.0.0';
    
    console.log(`🚄 Starting Quiz AI App...`);
    console.log(`📍 Target Port: ${PORT}`);
    console.log(`🔗 Host: ${HOST}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 API Key: ${GEMINI_API_KEY ? 'configured ✅' : 'missing ❌'}`);
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
        console.error('❌ Uncaught Exception:', err);
        process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });
    
    server.listen(PORT, HOST, () => {
        console.log(`🚄 Quiz AI App server running on Railway!`);
        console.log(`📍 Port: ${PORT}`);
        console.log(`🔗 Host: ${HOST}`);
        console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔑 API Key configured: ${GEMINI_API_KEY ? 'Yes ✅' : 'No ❌'}`);
        console.log(`🚀 Server ready for connections!`);
        console.log(`🌍 Health check: http://localhost:${PORT}/health`);
    }).on('error', (err) => {
        console.error('❌ Server failed to start:', err);
        console.error('❌ Error details:', {
            code: err.code,
            errno: err.errno,
            syscall: err.syscall,
            address: err.address,
            port: err.port
        });
        process.exit(1);
    });
}

// Mock data functions for testing without API key
function generateMockQuiz(topic, questionCount, difficulty = 'intermediate') {
    const difficultyData = {
        beginner: {
            questions: [
                {
                    question: `What is the most fundamental concept to understand when learning about ${topic}?`,
                    options: {
                        A: "Basic definitions and principles",
                        B: "Advanced implementation techniques", 
                        C: "Historical controversies",
                        D: "Quantum physics relationships"
                    },
                    correct: "A"
                },
                {
                    question: `If you were explaining ${topic} to a friend who's never heard of it, what would you start with?`,
                    options: {
                        A: "Complex mathematical formulas",
                        B: "Advanced theoretical frameworks",
                        C: "Simple everyday examples",
                        D: "Criticisms and limitations"
                    },
                    correct: "C"
                },
                {
                    question: `Which of these is typically the FIRST step when beginning to study ${topic}?`,
                    options: {
                        A: "Understanding basic vocabulary",
                        B: "Memorizing advanced terminology",
                        C: "Analyzing complex case studies",
                        D: "Debating controversial aspects"
                    },
                    correct: "A"
                }
            ]
        },
        intermediate: {
            questions: [
                {
                    question: `In a real-world scenario involving ${topic}, what would be the most practical approach to problem-solving?`,
                    options: {
                        A: "Rely purely on intuition",
                        B: "Use advanced techniques only", 
                        C: "Avoid systematic approaches",
                        D: "Apply knowledge systematically"
                    },
                    correct: "D"
                },
                {
                    question: `When analyzing different aspects of ${topic}, what demonstrates intermediate-level understanding?`,
                    options: {
                        A: "Memorizing basic definitions",
                        B: "Connecting concepts together",
                        C: "Knowing advanced theories",
                        D: "Focusing on historical development"
                    },
                    correct: "B"
                },
                {
                    question: `How would someone with moderate knowledge of ${topic} approach a challenging problem?`,
                    options: {
                        A: "Guess randomly",
                        B: "Use complex methods only",
                        C: "Break down and apply principles",
                        D: "Avoid the problem"
                    },
                    correct: "C"
                }
            ]
        },
        advanced: {
            questions: [
                {
                    question: `What distinguishes an advanced practitioner's approach to ${topic} from a beginner's?`,
                    options: {
                        A: "Memorizing more facts",
                        B: "Using complicated vocabulary",
                        C: "Avoiding practical applications",
                        D: "Synthesizing complex concepts"
                    },
                    correct: "D"
                },
                {
                    question: `In advanced applications of ${topic}, what is most crucial for success?`,
                    options: {
                        A: "Deep analytical thinking",
                        B: "Following basic formulas",
                        C: "Memorizing historical facts",
                        D: "Avoiding innovation"
                    },
                    correct: "A"
                },
                {
                    question: `How would an expert in ${topic} handle conflicting information or competing theories?`,
                    options: {
                        A: "Choose first theory learned",
                        B: "Ignore conflicting information",
                        C: "Critically evaluate evidence",
                        D: "Choose popular opinion"
                    },
                    correct: "C"
                }
            ]
        },
        expert: {
            questions: [
                {
                    question: `What characterizes expert-level mastery in ${topic}?`,
                    options: {
                        A: "The ability to innovate and create new knowledge",
                        B: "Simple memorization of facts", 
                        C: "Following established methods only",
                        D: "Avoiding complex topics"
                    },
                    correct: "A"
                },
                {
                    question: `How would a true expert approach an unprecedented challenge in ${topic}?`,
                    options: {
                        A: "Use only traditional methods",
                        B: "Rely on trial and error",
                        C: "Synthesize knowledge from multiple domains",
                        D: "Seek approval before acting"
                    },
                    correct: "C"
                },
                {
                    question: `What role does ${topic} play in broader intellectual and practical contexts according to expert understanding?`,
                    options: {
                        A: "Exists in isolation",
                        B: "Only matters in narrow scope",
                        C: "Has no practical applications",
                        D: "Interconnects with multiple disciplines"
                    },
                    correct: "D"
                }
            ]
        }
    };

    const selectedQuestions = difficultyData[difficulty]?.questions || difficultyData.intermediate.questions;
    
    // Generate additional questions dynamically to reach the requested count
    const additionalQuestions = [
        {
            question: `What would happen if the core principles of ${topic} were applied to solve a completely different type of problem?`,
            options: {
                A: "Nothing useful would result",
                B: "It would create more confusion",
                C: "The principles only work originally",
                D: "Could lead to innovative solutions"
            },
            correct: "D"
        },
        {
            question: `How has the understanding of ${topic} evolved, and what does this tell us about knowledge development?`,
            options: {
                A: "Knowledge builds upon discoveries",
                B: "It hasn't changed over time",
                C: "All new ideas are wrong",
                D: "Evolution is irrelevant"
            },
            correct: "A"
        },
        {
            question: `What creative applications of ${topic} might we see in the next decade?`,
            options: {
                A: "No new applications possible",
                B: "Only traditional uses continue",
                C: "Innovative tech combinations",
                D: "Less relevance over time"
            },
            correct: "C"
        }
    ];

    let allQuestions = [...selectedQuestions, ...additionalQuestions];
    
    // Generate more questions if needed to reach the requested count
    const questionTemplates = [
        { q: `Why is ${topic} considered important in modern contexts?`, opts: ["Outdated concept", "Widely applicable", "Only academic", "Irrelevant"], correct: "B" },
        { q: `What misconceptions exist about ${topic}?`, opts: ["All beliefs are correct", "People often oversimplify it", "No misconceptions", "It's too simple"], correct: "B" },
        { q: `How do experts typically approach learning ${topic}?`, opts: ["Memorization only", "Systematic study", "Random trial", "Avoiding practice"], correct: "B" },
        { q: `What are the main challenges in understanding ${topic}?`, opts: ["No challenges", "Complexity and interconnections", "Too easy", "Not worth learning"], correct: "B" },
        { q: `How does ${topic} relate to real-world problem solving?`, opts: ["Not related", "Essential foundation", "Only theory", "Rarely used"], correct: "B" },
        { q: `What skills are developed through studying ${topic}?`, opts: ["No skills", "Analytical and critical thinking", "Only memorization", "Nothing useful"], correct: "B" },
        { q: `How can ${topic} be applied in your daily life?`, opts: ["Cannot be applied", "Multiple practical uses", "Only in work", "Never applicable"], correct: "B" },
        { q: `What is the relationship between ${topic} and innovation?`, opts: ["No relationship", "Drives innovation", "Prevents innovation", "Unrelated concept"], correct: "B" },
        { q: `How does ${topic} contribute to professional success?`, opts: ["Doesn't help", "Highly valuable skill", "Minimal impact", "Career limiting"], correct: "B" },
        { q: `What evidence supports understanding ${topic}?`, opts: ["No evidence", "Research and real-world success", "Just opinion", "Theoretical only"], correct: "B" }
    ];

    // Fill remaining questions dynamically
    while (allQuestions.length < questionCount) {
        const template = questionTemplates[allQuestions.length % questionTemplates.length];
        allQuestions.push({
            question: template.q,
            options: {
                A: template.opts[0],
                B: template.opts[1],
                C: template.opts[2],
                D: template.opts[3]
            },
            correct: template.correct
        });
    }
    
    // Return the requested number of questions
    const finalQuestions = allQuestions.slice(0, questionCount);
    return shuffleAnswers(finalQuestions);
}

function generateMockDocumentQuiz(fileContent, questionCount, difficulty = 'intermediate') {
    // Extract some keywords from the document for more relevant questions
    const words = fileContent.toLowerCase().split(/\s+/).filter(word => word.length > 4);
    const commonWords = ['javascript', 'programming', 'function', 'variable', 'code', 'development', 'system', 'process', 'method', 'concept'];
    const relevantWords = words.filter(word => commonWords.includes(word)).slice(0, 3);
    const context = relevantWords.length > 0 ? relevantWords.join(', ') : 'the document content';

    const difficultyData = {
        beginner: {
            questions: [
                {
                    question: `Based on the document, what is the main topic being discussed?`,
                    options: {
                        A: `Key concepts related to ${context} and their applications`,
                        B: "Unrelated historical events",
                        C: "Abstract philosophical debates",
                        D: "Random technical specifications"
                    },
                    correct: "A"
                },
                {
                    question: "What does the document suggest is important for beginners to understand?",
                    options: {
                        A: "Complex advanced theories only",
                        B: "Fundamental concepts and basic principles explained in the text",
                        C: "Controversial opinions without context",
                        D: "Memorization without comprehension"
                    },
                    correct: "B"
                }
            ]
        },
        intermediate: {
            questions: [
                {
                    question: `How does the document connect different concepts related to ${context}?`,
                    options: {
                        A: "Treats concepts in isolation",
                        B: "Only presents conflicting views",
                        C: "Shows relationships between concepts",
                        D: "Avoids making connections"
                    },
                    correct: "C"
                },
                {
                    question: "What can be inferred about best practices from the document?",
                    options: {
                        A: "Follow guidelines with understanding",
                        B: "Best practices are irrelevant",
                        C: "Any approach is valid",
                        D: "Never question tradition"
                    },
                    correct: "A"
                }
            ]
        },
        advanced: {
            questions: [
                {
                    question: `What deeper implications can be drawn from the document's discussion of ${context}?`,
                    options: {
                        A: "No broader implications exist",
                        B: "Purely theoretical, no value",
                        C: "Too complex to understand",
                        D: "Wide-ranging applications exist"
                    },
                    correct: "D"
                },
                {
                    question: "How would you critically evaluate the approach presented in the document?",
                    options: {
                        A: "Accept everything without question",
                        B: "Analyze reasoning and evidence",
                        C: "Reject everything automatically",
                        D: "Focus only on faults"
                    },
                    correct: "B"
                }
            ]
        },
        expert: {
            questions: [
                {
                    question: `How might the principles discussed in the document be synthesized with other domains of knowledge?`,
                    options: {
                        A: "Cannot connect to other fields",
                        B: "Synthesis is counterproductive", 
                        C: "Each domain stays separate",
                        D: "Could reveal cross-disciplinary innovations"
                    },
                    correct: "D"
                },
                {
                    question: "What original insights or innovations might emerge from a deep understanding of this document?",
                    options: {
                        A: "Deep understanding leads to breakthroughs",
                        B: "No insights from existing knowledge",
                        C: "Innovation unrelated to understanding",
                        D: "Only predetermined conclusions"
                    },
                    correct: "A"
                }
            ]
        }
    };

    const selectedQuestions = difficultyData[difficulty]?.questions || difficultyData.intermediate.questions;
    
    // Add more creative questions based on document analysis
    const additionalQuestions = [
        {
            question: "What creative applications of the document's concepts might be possible in other contexts?",
            options: {
                A: "No applications outside original",
                B: "Applications never deviate",
                C: "Creative adaptation leads to innovation",
                D: "Creativity has no place"
            },
            correct: "C"
        },
        {
            question: "How does the document's approach compare to alternative methodologies?",
            options: {
                A: "No alternatives exist",
                B: "All approaches are identical",
                C: "Comparison wastes time",
                D: "Comparing reveals improvement opportunities"
            },
            correct: "D"
        }
    ];

    let allQuestions = [...selectedQuestions, ...additionalQuestions];

    // Generate more questions dynamically if needed
    const docQuestionTemplates = [
        { q: "What is the primary focus of the document?", opts: ["Unrelated topics", "Main subject matter", "Contradictions", "Unimportant details"], correct: "B" },
        { q: "How well does the document support its main points?", opts: ["Not supported", "With evidence and examples", "Only opinion", "Poorly supported"], correct: "B" },
        { q: "What key takeaway can be extracted from this document?", opts: ["No clear message", "Important insights provided", "Confusing", "Irrelevant"], correct: "B" },
        { q: "How does this document enhance understanding of the topic?", opts: ["No enhancement", "Provides clarity and depth", "Causes confusion", "Oversimplifies"], correct: "B" },
        { q: "What makes this document valuable for learners?", opts: ["No value", "Clear explanations and examples", "Too technical", "Lacks structure"], correct: "B" },
        { q: "How are concepts organized in this document?", opts: ["Randomly scattered", "Logically structured", "Very confusing", "Too simple"], correct: "B" },
        { q: "What aspects of the content are most significant?", opts: ["All equally unimportant", "Core concepts critical to understanding", "Only minor details matter", "Nothing significant"], correct: "B" },
        { q: "How does the document address potential questions?", opts: ["Ignores questions", "Thoroughly addresses concerns", "Avoids clarification", "No explanation provided"], correct: "B" },
        { q: "What would someone learn by studying this document?", opts: ["Nothing useful", "Practical and theoretical knowledge", "Only basics", "Irrelevant information"], correct: "B" },
        { q: "How applicable is this document's content in practice?", opts: ["Never applicable", "Highly practical and useful", "Only theoretical", "Rarely applicable"], correct: "B" }
    ];

    // Fill remaining questions dynamically
    while (allQuestions.length < questionCount) {
        const template = docQuestionTemplates[allQuestions.length % docQuestionTemplates.length];
        allQuestions.push({
            question: template.q,
            options: {
                A: template.opts[0],
                B: template.opts[1],
                C: template.opts[2],
                D: template.opts[3]
            },
            correct: template.correct
        });
    }
    
    // Return the requested number of questions
    const finalQuestions = allQuestions.slice(0, questionCount);
    return shuffleAnswers(finalQuestions);
}
