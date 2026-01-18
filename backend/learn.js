// API base can be set by the hosting environment by adding a small script
// before the main bundle that sets `window.API_BASE = 'https://your-backend.com'`.
const API_BASE = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : 'http://localhost:3001';

let quizData = {
    questions: [],
    currentQuestion: 0,
    score: 0,
    answers: [],
    timeLimit: 0,
    timeRemaining: 0,
    mode: 'single', // 'single' or 'multiplayer'
    multiplayer: {
        socket: null,
        pin: null,
        isHost: false,
        players: [],
        roomStarted: false
    }
};

function switchMode(mode) {
    // Change 'block' to 'flex' so it respects your centering CSS
    document.getElementById('topic-form').style.display = mode === 'topic' ? 'flex' : 'none';
    document.getElementById('document-form').style.display = mode === 'document' ? 'flex' : 'none';
    
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    // Use event.currentTarget to ensure the correct element is targeted
    event.currentTarget.classList.add('active');
}

function showMessage(text, type = 'error') {
    const msgDiv = document.getElementById('message');
    // Added text-align: center to the style attribute
    msgDiv.style.textAlign = 'center'; 
    msgDiv.innerHTML = `<div class="${type}">${text}</div>`;
    setTimeout(() => msgDiv.innerHTML = '', 5000);
}

async function generateTopicQuiz() {
    const topic = document.getElementById('topic').value;
    const questionCount = parseInt(document.getElementById('topicQuestions').value);
    const difficulty = document.getElementById('topicDifficulty').value;

    if (!topic.trim()) {
        showMessage('Please enter a topic');
        return;
    }

    showLoading('Creating your quiz...');

    try {
        const response = await fetch(`${API_BASE}/api/generate-quiz/topic`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                topic,
                questionCount,
                difficulty
            })
        });

        if (!response.ok) throw new Error('Failed to create quiz');
        
        const data = await response.json();
        quizData.questions = data.questions;
        quizData.currentQuestion = 0;
        quizData.score = 0;
        quizData.answers = [];
        quizData.mode = 'single';
        
        startQuiz();
    } catch (error) {
        showMessage('Error creating quiz: ' + error.message);
    }
}

async function generateDocumentQuiz() {
    const fileInput = document.getElementById('document');
    const file = fileInput.files[0];
    const questionCount = parseInt(document.getElementById('docQuestions').value);
    const difficulty = document.getElementById('docDifficulty').value;

    if (!file) {
        showMessage('Please select a document');
        return;
    }

    showLoading('Processing document and creating quiz...');

    try {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('questionCount', questionCount);
        formData.append('difficulty', difficulty);

        const response = await fetch(`${API_BASE}/api/generate-quiz/document`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Failed to generate quiz');
        
        const data = await response.json();
        quizData.questions = data.questions;
        quizData.currentQuestion = 0;
        quizData.score = 0;
        quizData.answers = [];
        quizData.mode = 'single';
        
        startQuiz();
    } catch (error) {
        showMessage('Error generating quiz: ' + error.message);
    }
}

function startQuiz() {
    document.getElementById('home').classList.remove('active');
    document.getElementById('quiz').classList.add('active');
    displayQuestion();
}

function displayQuestion() {
    const question = quizData.questions[quizData.currentQuestion];
    const progress = ((quizData.currentQuestion + 1) / quizData.questions.length) * 100;
    
    document.getElementById('progressFill').style.width = progress + '%';

    let html = `
        <div class="question">
            <div style="color: #EE247C; margin-bottom: 10px;">Question ${quizData.currentQuestion + 1} of ${quizData.questions.length}</div>
            <div class="question-text">${question.question}</div>
            <div class="options">
    `;

    for (const [key, option] of Object.entries(question.options)) {
        html += `
            <div class="option" onclick="selectAnswer('${key}')">
                <strong>${key}:</strong> ${option}
            </div>
        `;
    }

    html += `</div></div><button class="btn" onclick="nextQuestion()">NEXT</button>`;
    document.getElementById('quizContent').innerHTML = html;
}

function selectAnswer(key) {
    document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
    event.target.closest('.option').classList.add('selected');
    quizData.answers[quizData.currentQuestion] = key;
}

function nextQuestion() {
    const question = quizData.questions[quizData.currentQuestion];
    const userAnswer = quizData.answers[quizData.currentQuestion];

    if (userAnswer === question.correct) {
        quizData.score++;
    }

    quizData.currentQuestion++;

    if (quizData.currentQuestion < quizData.questions.length) {
        displayQuestion();
    } else {
        finishQuiz();
    }
}

function finishQuiz() {
    const percentage = Math.round((quizData.score / quizData.questions.length) * 100);
    
    document.getElementById('quiz').classList.remove('active');
    document.getElementById('results').classList.add('active');

    let resultsHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 3em; color: #EE247C; margin-bottom: 10px;">${percentage}%</div>
            <div style="font-size: 1.5em;">You got ${quizData.score} out of ${quizData.questions.length} correct</div>
        </div>
    `;

    document.getElementById('resultsContent').innerHTML = resultsHTML;
}

function showMultiplayer() {
    document.getElementById('home').classList.remove('active');
    document.getElementById('multiplayer').classList.add('active');
    
    const socket = io(API_BASE);
    quizData.multiplayer.socket = socket;
    quizData.mode = 'multiplayer';

    let html = `
        <div style="display: flex; flex-direction: row; justify-content: center; gap: 20px; margin-bottom: 20px; width: 100%;">
            <button class="btn multi-btn" onclick="createRoom()">CREATE ROOM</button>
            <button class="btn multi-btn" onclick="showJoinForm()">JOIN ROOM</button>
        </div>
        <div id="multiplayer-form" style="display: flex; flex-direction: column; align-items: center;"></div>
        <div id="room-display" style="display: flex; flex-direction: column; align-items: center;"></div>
    `;

    document.getElementById('multiplayer-content').innerHTML = html;

    socket.on('roomCreated', (data) => {
        quizData.multiplayer.pin = data.pin;
        quizData.multiplayer.isHost = true;
        displayRoom();
    });

    socket.on('joinedRoom', (data) => {
        quizData.multiplayer.pin = data.pin;
        quizData.multiplayer.isHost = false;
        displayRoom();
    });

    socket.on('playerJoined', (data) => {
        quizData.multiplayer.players = data.players;
        updatePlayersList();
    });

    socket.on('quizStarted', (data) => {
        quizData.questions = data.questions;
        quizData.currentQuestion = 0;
        quizData.score = 0;
        quizData.answers = [];
        quizData.timeLimit = data.timeLimit;
        document.getElementById('multiplayer').classList.remove('active');
        document.getElementById('quiz').classList.add('active');
        displayQuestion();
    });

    socket.on('quizResults', (data) => {
        displayMultiplayerResults(data.results);
    });

    socket.on('error', (data) => {
        showMessage('Error: ' + data.message);
    });
}

function createRoom() {
    const topic = prompt('Enter a subject for the quiz:');
    if (!topic) return;

    const questionCount = prompt('Number of questions:', '5');
    const difficulty = prompt('Difficulty (beginner/intermediate/advanced/expert):', 'intermediate');

    // Generate quiz first
            fetch(`${API_BASE}/api/generate-quiz/topic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            topic,
            questionCount: parseInt(questionCount),
            difficulty
        })
    })
    .then(r => r.json())
    .then(data => {
        quizData.multiplayer.socket.emit('createRoom', {
            questions: data.questions,
            timeLimit: 0
        });
    });
}

function showJoinForm() {
    const pin = prompt('Enter room PIN:');
    if (!pin) return;

    const name = prompt('Enter your first name:');
    if (!name) return;

    quizData.multiplayer.socket.emit('joinRoom', { pin, name });
}

function displayRoom() {
    const html = `
        <div class="room-info" style="display: flex; flex-direction: column; align-items: center;">
            <div><strong>ROOM PIN:</strong> <span style="color: #EE247C; font-size: 1.3em;">${quizData.multiplayer.pin}</span></div>
            <div style="margin-top: 10px;">Share this PIN with others to join</div>
            
            ${quizData.multiplayer.isHost ? '<button class="btn" onclick="startMultiplayerQuiz()" style="margin-top: 20px;">START QUIZ</button>' : ''}
        </div>
        
        <h3 style="margin: 20px 0;">Players (${quizData.multiplayer.players.length})</h3>
        <div id="players-list"></div>
    `;
    document.getElementById('room-display').innerHTML = html;
    updatePlayersList();
}

function updatePlayersList() {
    let html = '';
    quizData.multiplayer.players.forEach(player => {
        html += `
            <div class="player">
                <span>${player.name}${player.isHost ? ' 👑' : ''}</span>
                <span style="color: #EE247C;">Ready</span>
            </div>
        `;
    });
    const playersList = document.getElementById('players-list');
    if (playersList) playersList.innerHTML = html;
}

function startMultiplayerQuiz() {
    quizData.multiplayer.socket.emit('startQuiz', { pin: quizData.multiplayer.pin });
}

function displayMultiplayerResults(results) {
    document.getElementById('quiz').classList.remove('active');
    document.getElementById('results').classList.add('active');

    let html = '<h3 style="margin-bottom: 20px;">Final Leaderboard</h3>';
    results.forEach((result, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        html += `
            <div class="result-item ${index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : ''}">
                <span>${medal} ${result.name}</span>
                <span class="score">${result.percentage}% (${result.score}/${result.total})</span>
            </div>
        `;
    });

    document.getElementById('resultsContent').innerHTML = html;
}

function showLoading(text) {
    document.getElementById('quizContent').innerHTML = `<div class="loading">${text}<div class="spinner"></div></div>`;
    document.getElementById('home').classList.remove('active');
    document.getElementById('quiz').classList.add('active');
}

function goHome() {
    document.getElementById('results').classList.remove('active');
    document.getElementById('home').classList.add('active');
    document.getElementById('message').innerHTML = '';
}