// API base can be set by the hosting environment by adding a small script
// before the main bundle that sets `window.API_BASE = 'https://your-backend.com'`.
const API_BASE = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : 'https://braniac-backend.onrender.com';

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
        quizData.quizType = 'topic';
        quizData.quizName = topic;
        
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
        quizData.quizType = 'document';
        quizData.quizName = data.summary || file.name.substring(0, 30);
        quizData.documentFile = file.name;
        
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
    // Validate that we have questions and a valid current question index
    if (!quizData.questions || quizData.questions.length === 0) {
        console.error('No questions available to display');
        showMessage('Error: No questions available');
        return;
    }
    
    if (quizData.currentQuestion >= quizData.questions.length) {
        console.error('Question index out of range');
        return;
    }
    
    const question = quizData.questions[quizData.currentQuestion];
    
    if (!question || !question.question || !question.options) {
        console.error('Invalid question data:', question);
        showMessage('Error: Invalid question data');
        return;
    }
    
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
    
    // Save score to localStorage
    saveScore({
        type: quizData.mode === 'multiplayer' ? 'multiplayer' : (quizData.quizType || 'topic'),
        name: quizData.quizName || 'Quiz',
        score: quizData.score,
        total: quizData.questions.length,
        percentage: percentage,
        date: new Date().toISOString()
    });
    
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
        <div id="multiplayer-menu" style="display: flex; flex-direction: row; justify-content: center; gap: 20px; margin-bottom: 20px; width: 100%;">
            <button class="btn multi-btn" onclick="showCreateRoomForm()">CREATE ROOM</button>
            <button class="btn multi-btn" onclick="showJoinForm()">JOIN ROOM</button>
        </div>
        <div id="multiplayer-form" style="display: flex; flex-direction: column; align-items: center;"></div>
        <div id="room-display" style="display: flex; flex-direction: column; align-items: center;"></div>
    `;

    document.getElementById('multiplayer-content').innerHTML = html;

    socket.on('roomCreated', (data) => {
        quizData.multiplayer.pin = data.pin;
        quizData.multiplayer.isHost = true;
        quizData.multiplayer.players = data.players || [];
        displayRoom();
    });

    socket.on('joinedRoom', (data) => {
        quizData.multiplayer.pin = data.pin;
        quizData.multiplayer.isHost = false;
        quizData.multiplayer.players = data.players || [];
        displayRoom();
    });

    socket.on('playerJoined', (data) => {
        quizData.multiplayer.players = data.players;
        updatePlayersList();
    });

    socket.on('quizStarted', (data) => {
        console.log('Quiz started event received:', data);
        
        if (!data.questions || data.questions.length === 0) {
            console.error('No questions received from server');
            showMessage('Error: No questions received from server');
            return;
        }
        
        quizData.questions = data.questions;
        quizData.currentQuestion = 0;
        quizData.score = 0;
        quizData.answers = [];
        quizData.timeLimit = data.timeLimit;
        
        console.log(`Starting quiz with ${quizData.questions.length} questions`);
        
        document.getElementById('multiplayer').classList.remove('active');
        document.getElementById('quiz').classList.add('active');
        displayQuestion();
    });

    socket.on('quizResults', (data) => {
        displayMultiplayerResults(data.results);
    });

    socket.on('error', (data) => {
        showMessage('Error: ' + data.message, 'error');
        console.error('Multiplayer error:', data.message);
        // Clear any form that might be showing
        const formContainer = document.getElementById('multiplayer-form');
        if (formContainer) {
            formContainer.innerHTML = '';
        }
        // Show the CREATE/JOIN buttons again
        const menuButtons = document.getElementById('multiplayer-menu');
        if (menuButtons) {
            menuButtons.style.display = 'flex';
        }
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from multiplayer server');
    });
}

function showCreateRoomForm() {
    // Hide the CREATE/JOIN buttons
    const menuButtons = document.getElementById('multiplayer-menu');
    if (menuButtons) {
        menuButtons.style.display = 'none';
    }
    
    const formHtml = `
        <div class="quiz-form" style="width: 100%; max-width: 500px;">
            <h3 style="margin-bottom: 20px; text-align: center;">Create Multiplayer Room</h3>
            
            <div class="form-group">
                <label for="multiplayerTopic">Topic</label>
                <input type="text" id="multiplayerTopic" placeholder="e.g., Photosynthesis, JavaScript, World War II" required>
            </div>

            <div class="form-group">
                <label for="multiplayerQuestions">Number of Questions</label>
                <input type="number" id="multiplayerQuestions" value="5" min="1" max="50" required>
            </div>

            <div class="form-group">
                <label for="multiplayerDifficulty">Difficulty</label>
                <select id="multiplayerDifficulty" required>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate" selected>Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                </select>
            </div>

            <button class="btn" onclick="createRoom()" style="width: 100%; margin-top: 10px;">CREATE ROOM</button>
            <button class="btn" onclick="cancelRoomCreation()" style="width: 100%; margin-top: 10px; background: #666;">CANCEL</button>
        </div>
    `;
    
    document.getElementById('multiplayer-form').innerHTML = formHtml;
}

function cancelRoomCreation() {
    document.getElementById('multiplayer-form').innerHTML = '';
    // Show the CREATE/JOIN buttons again
    const menuButtons = document.getElementById('multiplayer-menu');
    if (menuButtons) {
        menuButtons.style.display = 'flex';
    }
}

function createRoom() {
    const topic = document.getElementById('multiplayerTopic')?.value;
    const questionCount = document.getElementById('multiplayerQuestions')?.value;
    const difficulty = document.getElementById('multiplayerDifficulty')?.value;

    if (!topic || !topic.trim()) {
        showMessage('Please enter a topic');
        return;
    }

    // Store quiz name for score tracking
    quizData.quizName = topic;
    quizData.quizType = 'multiplayer';

    // Get host name from session
    const session = JSON.parse(localStorage.getItem('braniacSession'));
    let hostName;
    
    if (session && session.type === 'user') {
        hostName = session.firstName || session.username;
    } else {
        hostName = 'Guest';
    }

    // Show loading state
    document.getElementById('multiplayer-form').innerHTML = '<div class="loading">Creating room...<div class="spinner"></div></div>';

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
        // Validate that we received questions
        if (!data.questions || data.questions.length === 0) {
            showMessage('Failed to generate quiz questions. Please try again.');
            console.error('No questions received from quiz generation API');
            document.getElementById('multiplayer-form').innerHTML = '';
            // Show the CREATE/JOIN buttons again
            const menuButtons = document.getElementById('multiplayer-menu');
            if (menuButtons) {
                menuButtons.style.display = 'flex';
            }
            return;
        }
        
        console.log(`Generated ${data.questions.length} questions for multiplayer room`);
        
        quizData.multiplayer.socket.emit('createRoom', {
            questions: data.questions,
            timeLimit: 0,
            hostName: hostName
        });
        
        // Clear the form after successfully creating room
        document.getElementById('multiplayer-form').innerHTML = '';
    })
    .catch(err => {
        showMessage('Failed to generate quiz: ' + err.message);
        console.error('Quiz generation error:', err);
        document.getElementById('multiplayer-form').innerHTML = '';
        // Show the CREATE/JOIN buttons again
        const menuButtons = document.getElementById('multiplayer-menu');
        if (menuButtons) {
            menuButtons.style.display = 'flex';
        }
    });
}

function showJoinForm() {
    // Hide the CREATE/JOIN buttons
    const menuButtons = document.getElementById('multiplayer-menu');
    if (menuButtons) {
        menuButtons.style.display = 'none';
    }
    
    const formHtml = `
        <div class="quiz-form" style="width: 100%; max-width: 500px;">
            <h3 style="margin-bottom: 20px; text-align: center;">Join Multiplayer Room</h3>
            
            <div class="form-group">
                <label for="roomPin">Room PIN</label>
                <input type="text" id="roomPin" placeholder="Enter 6-digit PIN" maxlength="6" required>
            </div>

            <button class="btn" onclick="joinRoom()" style="width: 100%; margin-top: 10px;">JOIN ROOM</button>
            <button class="btn" onclick="cancelJoinRoom()" style="width: 100%; margin-top: 10px; background: #666;">CANCEL</button>
        </div>
    `;
    
    document.getElementById('multiplayer-form').innerHTML = formHtml;
}

function cancelJoinRoom() {
    document.getElementById('multiplayer-form').innerHTML = '';
    // Show the CREATE/JOIN buttons again
    const menuButtons = document.getElementById('multiplayer-menu');
    if (menuButtons) {
        menuButtons.style.display = 'flex';
    }
}

function joinRoom() {
    const pin = document.getElementById('roomPin')?.value;

    if (!pin || !pin.trim()) {
        showMessage('Please enter a room PIN');
        return;
    }

    // Auto-use firstName from session
    const session = JSON.parse(localStorage.getItem('braniacSession'));
    let name;
    
    if (session && session.type === 'user') {
        // Use registered user's first name
        name = session.firstName || session.username;
    } else {
        // For guests, server will assign "Guest 1", "Guest 2", etc.
        name = 'Guest';
    }

    // Show loading state
    document.getElementById('multiplayer-form').innerHTML = '<div class="loading">Joining room...<div class="spinner"></div></div>';

    quizData.multiplayer.socket.emit('joinRoom', { pin, name });
}

function displayRoom() {
    // Hide create/join room buttons once a room is created or joined
    const buttonsContainer = document.querySelector('#multiplayer-content > div');
    if (buttonsContainer) {
        buttonsContainer.style.display = 'none';
    }
    
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

    // Save multiplayer score for current user
    const session = JSON.parse(localStorage.getItem('braniacSession'));
    const currentUserResult = results.find(r => r.name === (session?.firstName || session?.username || 'Guest'));
    
    if (currentUserResult) {
        saveScore({
            type: 'multiplayer',
            name: quizData.quizName || 'Multiplayer Quiz',
            score: currentUserResult.score,
            total: currentUserResult.total,
            percentage: currentUserResult.percentage,
            date: new Date().toISOString()
        });
    }

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
    document.getElementById('quiz').classList.remove('active');
    document.getElementById('multiplayer').classList.remove('active');
    document.getElementById('home').classList.add('active');
    document.getElementById('message').innerHTML = '';
    
    // Clean up multiplayer state
    if (quizData.multiplayer.socket) {
        quizData.multiplayer.socket.disconnect();
    }
    quizData.multiplayer = {
        socket: null,
        pin: null,
        isHost: false,
        players: [],
        roomStarted: false
    };
    quizData.mode = 'single';
}

// Save score to localStorage
async function saveScore(scoreData) {
    try {
        // Save to localStorage for immediate access
        const scores = JSON.parse(localStorage.getItem('userScores')) || [];
        scores.unshift(scoreData); // Add to beginning
        
        // Keep only last 50 scores in localStorage
        if (scores.length > 50) {
            scores.length = 50;
        }
        
        localStorage.setItem('userScores', JSON.stringify(scores));
        
        // Also save to backend/MongoDB
        const result = await saveScoreToBackend(scoreData);
        
        // Dispatch custom event to notify other pages
        window.dispatchEvent(new CustomEvent('scoreUpdated', { detail: scoreData }));
        
        return result;
    } catch (error) {
        console.error('Error saving score:', error);
    }
}

// Save score to backend API
async function saveScoreToBackend(scoreData) {
    try {
        const session = JSON.parse(localStorage.getItem('braniacSession'));
        
        // Only save to backend for registered users
        if (!session || session.type !== 'user') {
            console.log('Guest user - score saved to localStorage only');
            return;
        }
        
        const response = await fetch(`${API_BASE}/api/user/score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Include cookies for auth
            body: JSON.stringify({
                topic: scoreData.name,
                score: scoreData.percentage,
                totalQuestions: scoreData.total,
                correctAnswers: scoreData.score,
                difficulty: 'intermediate',
                timeSpent: 0,
                quizType: scoreData.type,
                date: scoreData.date
            })
        });
        
        if (response.ok) {
            console.log('✅ Score saved to database successfully');
            const result = await response.json();
            return result;
        } else {
            console.error('❌ Failed to save score to database:', response.status);
            return null;
        }
    } catch (error) {
        console.error('❌ Error saving score to backend:', error);
        return null;
    }
}