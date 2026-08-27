// Quiz AI App - Main JavaScript File
// Handles all game logic, Gemini API calls, and multiplayer functionality

// Configuration - Update this URL after deploying the backend
const API_BASE_URL = 'https://braniac-ten.vercel.app'; // Replace with your deployed backend URL

class QuizApp {
    constructor() {
        this.currentScreen = 'landing-page';
        this.currentQuestion = 0;
        this.score = 0;
        this.questions = [];
        this.isMultiplayer = false;
        this.isHost = false;
        this.roomPin = null;
        this.playerName = null;
        this.players = [];
        this.socket = null;
        this.selectedAnswer = null;
        this.hasAnswered = false;
        this.timeLimit = 0; // Time limit per question in seconds (0 = no limit)
        this.timer = null; // Timer interval
        this.timeRemaining = 0; // Current question time remaining
        
        this.init();
    }
    
    init() {
        this.initializeSocketIO();
        this.bindEvents();
    }
    
    initializeSocketIO() {
        // Initialize Socket.IO connection for multiplayer
        try {
            this.socket = io(API_BASE_URL);
            this.setupSocketEvents();
        } catch (error) {
            console.log('Socket.IO not available - multiplayer disabled');
        }
    }
    
    setupSocketEvents() {
        if (!this.socket) return;
        
        this.socket.on('roomCreated', (data) => {
            this.roomPin = data.pin;
            this.isHost = true;
            this.showWaitingRoom();
        });
        
        this.socket.on('joinedRoom', (data) => {
            this.roomPin = data.pin;
            this.players = data.players;
            this.showWaitingRoom();
        });
        
        this.socket.on('playerJoined', (data) => {
            this.players = data.players;
            this.updatePlayersList();
        });
        
        this.socket.on('playerLeft', (data) => {
            this.players = data.players;
            this.updatePlayersList();
        });
        
        this.socket.on('quizStarted', (data) => {
            this.questions = data.questions;
            this.timeLimit = data.timeLimit || 0;
            this.startQuizGame();
        });
        
        this.socket.on('quizResults', (data) => {
            this.showMultiplayerResults(data.results);
        });
        
        this.socket.on('error', (error) => {
            alert(error.message);
        });
    }
    
    bindEvents() {
        // File upload handlers
        document.getElementById('document-input').addEventListener('change', this.handleFileUpload.bind(this));
        document.getElementById('host-document-input').addEventListener('change', this.handleHostFileUpload.bind(this));
    }
    
    // Screen Navigation
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen with animation
        const targetScreen = document.getElementById(screenId);
        targetScreen.classList.add('active');
        targetScreen.classList.add('slide-in');
        
        this.currentScreen = screenId;
    }
    
    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }
    
    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }
    
    // Quiz Generation using server endpoints
    async generateQuizFromTopic(topic, questionCount, difficulty = 'intermediate') {
        try {
            const response = await fetch(`${API_BASE_URL}/api/generate-quiz/topic`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic: topic,
                    questionCount: questionCount,
                    difficulty: difficulty
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate quiz');
            }
            
            const data = await response.json();
            return data.questions;
        } catch (error) {
            console.error('Error generating quiz:', error);
            alert('Failed to generate quiz: ' + error.message);
            return null;
        }
    }
    
    async generateQuizFromDocument(file, questionCount, difficulty = 'intermediate') {
        try {
            const formData = new FormData();
            formData.append('document', file);
            formData.append('questionCount', questionCount);
            formData.append('difficulty', difficulty);
            
            const response = await fetch(`${API_BASE_URL}/api/generate-quiz/document`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate quiz from document');
            }
            
            const data = await response.json();
            return data.questions;
        } catch (error) {
            console.error('Error generating quiz:', error);
            alert('Failed to generate quiz from document: ' + error.message);
            return null;
        }
    }
    
    // File Handling
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check file type
        const fileExtension = file.name.toLowerCase().split('.').pop();
        if (fileExtension !== 'txt' && fileExtension !== 'pdf') {
            alert('Please upload a TXT or PDF file only.');
            event.target.value = ''; // Clear the input
            document.getElementById('file-name').textContent = '';
            document.querySelector('#document-setup .start-btn').disabled = true;
            return;
        }
        
        document.getElementById('file-name').textContent = file.name;
        
        try {
            // For PDF files, we don't need to read content on frontend since server handles it
            if (fileExtension === 'pdf') {
                document.querySelector('#document-setup .start-btn').disabled = false;
            } else {
                // For TXT files, still validate content
                const content = await this.readFileContent(file);
                if (content && content.trim().length > 0) {
                    document.querySelector('#document-setup .start-btn').disabled = false;
                } else {
                    alert('The file appears to be empty. Please upload a file with text content.');
                    document.querySelector('#document-setup .start-btn').disabled = true;
                }
            }
        } catch (error) {
            console.error('Error reading file:', error);
            alert('Error reading file. Please try again with a different file.');
            document.querySelector('#document-setup .start-btn').disabled = true;
        }
    }
    
    async handleHostFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check file type
        const fileExtension = file.name.toLowerCase().split('.').pop();
        if (fileExtension !== 'txt' && fileExtension !== 'pdf') {
            alert('Please upload a TXT or PDF file only.');
            event.target.value = ''; // Clear the input
            document.getElementById('host-file-name').textContent = '';
            document.querySelector('#host-document-setup .start-btn').disabled = true;
            return;
        }
        
        document.getElementById('host-file-name').textContent = file.name;
        
        try {
            // For PDF files, we don't need to read content on frontend since server handles it
            if (fileExtension === 'pdf') {
                document.querySelector('#host-document-setup .start-btn').disabled = false;
            } else {
                // For TXT files, still validate content
                const content = await this.readFileContent(file);
                if (content && content.trim().length > 0) {
                    document.querySelector('#host-document-setup .start-btn').disabled = false;
                } else {
                    alert('The file appears to be empty. Please upload a file with text content.');
                    document.querySelector('#host-document-setup .start-btn').disabled = true;
                }
            }
        } catch (error) {
            console.error('Error reading file:', error);
            alert('Error reading file. Please try again with a different file.');
            document.querySelector('#host-document-setup .start-btn').disabled = true;
        }
    }
    
    async readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }
    
    // Quiz Game Logic
    async startTopicQuiz() {
        const topic = document.getElementById('topic-input').value.trim();
        const questionCount = parseInt(document.getElementById('question-count').value);
        const difficulty = document.getElementById('difficulty-level').value;
        const timeLimit = parseInt(document.getElementById('time-limit').value);
        
        if (!topic) {
            alert('Please enter a topic');
            return;
        }
        
        this.showLoading('Generating quiz questions...');
        
        const questions = await this.generateQuizFromTopic(topic, questionCount, difficulty);
        if (questions) {
            this.questions = questions;
            this.timeLimit = timeLimit;
            this.startQuizGame();
        } else {
            this.showScreen('instant-play');
        }
    }
    
    async startDocumentQuiz() {
        const fileInput = document.getElementById('document-input');
        const questionCount = parseInt(document.getElementById('doc-question-count').value);
        const difficulty = document.getElementById('doc-difficulty-level').value;
        const timeLimit = parseInt(document.getElementById('doc-time-limit').value);
        
        if (!fileInput.files[0]) {
            alert('Please upload a document');
            return;
        }
        
        this.showLoading('Analyzing document and generating questions...');
        
        const questions = await this.generateQuizFromDocument(fileInput.files[0], questionCount, difficulty);
        
        if (questions) {
            this.questions = questions;
            this.timeLimit = timeLimit;
            this.startQuizGame();
        } else {
            this.showScreen('instant-play');
        }
    }
    
    startQuizGame() {
        this.currentQuestion = 0;
        this.score = 0;
        this.selectedAnswer = null;
        this.hasAnswered = false;
        
        this.showScreen('quiz-game');
        this.displayQuestion();
    }
    
    displayQuestion() {
        if (this.currentQuestion >= this.questions.length) {
            this.showResults();
            return;
        }
        
        // Clear any existing timer
        this.clearTimer();
        
        const question = this.questions[this.currentQuestion];
        
        // Update progress
        const progress = ((this.currentQuestion + 1) / this.questions.length) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
        
        // Update question counter and score
        document.getElementById('question-counter').textContent = 
            `Question ${this.currentQuestion + 1} of ${this.questions.length}`;
        document.getElementById('current-score').textContent = `Score: ${this.score}`;
        
        // Setup timer if time limit is set
        this.setupTimer();
        
        // Display question
        document.getElementById('question-text').textContent = question.question;
        
        // Display answers in A, B, C, D order
        const answersContainer = document.getElementById('answers-container');
        answersContainer.innerHTML = '';
        
        // Ensure proper A, B, C, D ordering
        const orderedKeys = ['A', 'B', 'C', 'D'];
        orderedKeys.forEach(key => {
            if (question.options[key]) {
                const button = document.createElement('button');
                button.className = 'answer-option';
                button.innerHTML = `<span class="answer-label">${key}.</span> ${question.options[key]}`;
                button.onclick = () => this.selectAnswer(key, button);
                answersContainer.appendChild(button);
            }
        });
        
        // Hide next button
        document.getElementById('next-btn').style.display = 'none';
        this.hasAnswered = false;
        this.selectedAnswer = null;
    }
    
    selectAnswer(selectedKey, buttonElement) {
        if (this.hasAnswered) return;
        
        this.selectedAnswer = selectedKey;
        this.hasAnswered = true;
        
        const question = this.questions[this.currentQuestion];
        const isCorrect = selectedKey === question.correct;
        
        // Update score
        if (isCorrect) {
            this.score++;
        }
        
        // Show correct/incorrect feedback
        const answerButtons = document.querySelectorAll('.answer-option');
        answerButtons.forEach(button => {
            button.classList.add('disabled');
            const buttonKey = button.querySelector('.answer-label').textContent.replace('.', '');
            
            if (buttonKey === question.correct) {
                button.classList.add('correct');
            } else if (buttonKey === selectedKey && !isCorrect) {
                button.classList.add('incorrect');
            }
        });
        
        // Show next button
        document.getElementById('next-btn').style.display = 'block';
        
        // Clear timer when answer is selected
        this.clearTimer();
        
        // Update score display
        document.getElementById('current-score').textContent = `Score: ${this.score}`;
    }
    
    // Timer Methods
    setupTimer() {
        const timerElement = document.getElementById('timer');
        
        if (this.timeLimit <= 0) {
            // No time limit
            timerElement.style.display = 'none';
            return;
        }
        
        // Show timer
        timerElement.style.display = 'block';
        this.timeRemaining = this.timeLimit;
        this.updateTimerDisplay();
        
        // Start countdown
        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();
            
            if (this.timeRemaining <= 0) {
                this.timeUp();
            }
        }, 1000);
    }
    
    updateTimerDisplay() {
        const timerElement = document.getElementById('timer');
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        timerElement.textContent = `⏱️ ${timeString}`;
        
        // Add visual warnings
        timerElement.className = 'timer';
        if (this.timeRemaining <= 10) {
            timerElement.classList.add('danger');
        } else if (this.timeRemaining <= 30) {
            timerElement.classList.add('warning');
        }
    }
    
    clearTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    timeUp() {
        if (this.hasAnswered) return;
        
        // Auto-submit as incorrect answer
        this.hasAnswered = true;
        this.clearTimer();
        
        // Show correct answer
        const question = this.questions[this.currentQuestion];
        const answerButtons = document.querySelectorAll('.answer-option');
        answerButtons.forEach(button => {
            button.classList.add('disabled');
            const buttonKey = button.querySelector('.answer-label').textContent.replace('.', '');
            
            if (buttonKey === question.correct) {
                button.classList.add('correct');
            }
        });
        
        // Show time up message
        const timerElement = document.getElementById('timer');
        timerElement.textContent = '⏰ Time Up!';
        timerElement.className = 'timer danger';
        
        // Show next button
        document.getElementById('next-btn').style.display = 'block';
    }
    
    nextQuestion() {
        this.currentQuestion++;
        this.displayQuestion();
    }
    
    showResults() {
        // Clear any remaining timer
        this.clearTimer();
        
        this.showScreen('results');
        
        const percentage = Math.round((this.score / this.questions.length) * 100);
        
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-total').textContent = `/ ${this.questions.length}`;
        document.getElementById('score-percentage').textContent = `${percentage}%`;
        
        if (this.isMultiplayer && this.socket) {
            this.socket.emit('submitScore', {
                pin: this.roomPin,
                score: this.score,
                total: this.questions.length
            });
        }
    }
    
    showMultiplayerResults(results) {
        this.showScreen('results');
        
        const myResult = results.find(r => r.name === this.playerName);
        if (myResult) {
            const percentage = Math.round((myResult.score / myResult.total) * 100);
            document.getElementById('final-score').textContent = myResult.score;
            document.getElementById('final-total').textContent = `/ ${myResult.total}`;
            document.getElementById('score-percentage').textContent = `${percentage}%`;
        }
        
        // Show leaderboard
        const multiplayerResults = document.getElementById('multiplayer-results');
        multiplayerResults.style.display = 'block';
        
        const leaderboard = document.getElementById('leaderboard');
        leaderboard.innerHTML = '';
        
        results.sort((a, b) => b.score - a.score).forEach((result, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <span class="leaderboard-rank">#${index + 1}</span>
                <span class="leaderboard-name">${result.name}</span>
                <span class="leaderboard-score">${result.score}/${result.total}</span>
            `;
            leaderboard.appendChild(item);
        });
    }
    
    // Multiplayer Functions
    async createHostRoom() {
        const topic = document.getElementById('host-topic-input').value.trim();
        const questionCount = parseInt(document.getElementById('host-question-count').value);
        const difficulty = document.getElementById('host-difficulty-level').value;
        const timeLimit = parseInt(document.getElementById('host-time-limit').value);
        
        if (!topic) {
            alert('Please enter a topic');
            return;
        }
        
        this.showLoading('Creating room and generating questions...');
        
        const questions = await this.generateQuizFromTopic(topic, questionCount, difficulty);
        if (questions && this.socket) {
            this.isMultiplayer = true;
            this.questions = questions;
            this.timeLimit = timeLimit;
            this.socket.emit('createRoom', { questions, timeLimit });
        } else {
            this.showScreen('host-setup');
        }
    }
    
    async createHostDocumentRoom() {
        const fileInput = document.getElementById('host-document-input');
        const questionCount = parseInt(document.getElementById('host-doc-question-count').value);
        const difficulty = document.getElementById('host-doc-difficulty-level').value;
        const timeLimit = parseInt(document.getElementById('host-doc-time-limit').value);
        
        if (!fileInput.files[0]) {
            alert('Please upload a document');
            return;
        }
        
        this.showLoading('Creating room and analyzing document...');
        
        const questions = await this.generateQuizFromDocument(fileInput.files[0], questionCount, difficulty);
        
        if (questions && this.socket) {
            this.isMultiplayer = true;
            this.questions = questions;
            this.timeLimit = timeLimit;
            this.socket.emit('createRoom', { questions, timeLimit });
        } else {
            this.showScreen('host-setup');
        }
    }
    
    joinRoom() {
        const pin = document.getElementById('join-pin').value.trim();
        const name = document.getElementById('player-name').value.trim();
        
        if (!pin || pin.length !== 6) {
            alert('Please enter a valid 6-digit PIN');
            return;
        }
        
        if (!name) {
            alert('Please enter your name');
            return;
        }
        
        if (!this.socket) {
            alert('Multiplayer not available - please check your connection');
            return;
        }
        
        this.isMultiplayer = true;
        this.playerName = name;
        this.socket.emit('joinRoom', { pin, name });
    }
    
    showWaitingRoom() {
        this.showScreen('waiting-room');
        
        document.getElementById('room-pin-display').textContent = this.roomPin;
        
        if (this.isHost) {
            document.getElementById('host-controls').style.display = 'block';
            document.getElementById('waiting-status').style.display = 'none';
        } else {
            document.getElementById('host-controls').style.display = 'none';
            document.getElementById('waiting-status').style.display = 'block';
        }
        
        this.updatePlayersList();
    }
    
    updatePlayersList() {
        const container = document.getElementById('players-container');
        container.innerHTML = '';
        
        this.players.forEach(player => {
            const item = document.createElement('div');
            item.className = 'player-item';
            item.innerHTML = `
                <span class="player-name">${player.name}</span>
                <span class="player-status">${player.isHost ? 'Host' : 'Player'}</span>
            `;
            container.appendChild(item);
        });
    }
    
    startMultiplayerQuiz() {
        if (this.socket && this.isHost) {
            this.socket.emit('startQuiz', { pin: this.roomPin });
        }
    }
    
    showLoading(text) {
        this.showScreen('loading');
        document.getElementById('loading-text').textContent = text;
    }
}

// Initialize the app
const quizApp = new QuizApp();

// Global functions for HTML onclick handlers
function showLanding() {
    quizApp.showScreen('landing-page');
    quizApp.isMultiplayer = false;
    quizApp.isHost = false;
}

function showInstantPlay() {
    quizApp.showScreen('instant-play');
}

function showMultiplayer() {
    quizApp.showScreen('multiplayer');
}

function showHostSetup() {
    quizApp.showScreen('host-setup');
}

function showJoinSetup() {
    quizApp.showScreen('join-setup');
}

function switchTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('#instant-play .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#instant-play .setup-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    event.target.classList.add('active');
    document.getElementById(`${tabName}-setup`).classList.add('active');
}

function switchHostTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('#host-setup .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#host-setup .setup-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    event.target.classList.add('active');
    document.getElementById(`host-${tabName}-setup`).classList.add('active');
}

function handleFileUpload() {
    quizApp.handleFileUpload(event);
}

function handleHostFileUpload() {
    quizApp.handleHostFileUpload(event);
}

function startTopicQuiz() {
    quizApp.startTopicQuiz();
}

function startDocumentQuiz() {
    quizApp.startDocumentQuiz();
}

function createHostRoom() {
    quizApp.createHostRoom();
}

function createHostDocumentRoom() {
    quizApp.createHostDocumentRoom();
}

function joinRoom() {
    quizApp.joinRoom();
}

function startMultiplayerQuiz() {
    quizApp.startMultiplayerQuiz();
}

function nextQuestion() {
    quizApp.nextQuestion();
}
