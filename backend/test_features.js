const fs = require('fs');
const http = require('http');

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}`;

async function testHealth() {
    console.log('Testing Health Endpoint...');
    try {
        const response = await fetch(`${BASE_URL}/health`);
        const data = await response.json();
        console.log('Health Endpoint:', data.status.toLowerCase() === 'ok' ? 'PASS' : 'FAIL', data);
        return data.status.toLowerCase() === 'ok';
    } catch (e) {
        console.error('Health Endpoint FAIL:', e.message);
        return false;
    }
}

async function testGenerateQuizTopic() {
    console.log('\nTesting AI Quiz Generation (Topic)...');
    try {
        const response = await fetch(`${BASE_URL}/api/generate-quiz/topic`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic: 'Capitals of the World',
                difficulty: 'easy',
                questionCount: 3,
                quizType: 'multiple-choice'
            })
        });
        const data = await response.json();
        if (data.success && data.quiz && data.quiz.length === 3) {
            console.log('Quiz Generation PASS. Generated', data.quiz.length, 'questions.');
            return true;
        } else {
            console.error('Quiz Generation FAIL:', data);
            return false;
        }
    } catch (e) {
        console.error('Quiz Generation FAIL:', e.message);
        return false;
    }
}

async function testGenerateQuizDocument() {
    console.log('\nTesting Document Processing (Upload)...');
    try {
        // Create a simple text file buffer
        const fileContent = "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar.";
        
        const formData = new FormData();
        const blob = new Blob([fileContent], { type: 'text/plain' });
        formData.append('document', blob, 'test.txt');
        formData.append('difficulty', 'easy');
        formData.append('questionCount', '2');
        formData.append('quizType', 'multiple-choice');

        const response = await fetch(`${BASE_URL}/api/generate-quiz/document`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.success && data.quiz && data.quiz.length === 2) {
            console.log('Document Processing PASS. Generated', data.quiz.length, 'questions.');
            return true;
        } else {
            console.error('Document Processing FAIL:', data);
            return false;
        }
    } catch (e) {
        console.error('Document Processing FAIL:', e.message);
        return false;
    }
}

async function runTests() {
    // wait a bit for server to fully start
    await new Promise(r => setTimeout(r, 2000));
    const healthOk = await testHealth();
    if (!healthOk) {
        console.error("Server is not healthy. Aborting tests.");
        process.exit(1);
    }
    
    await testGenerateQuizTopic();
    await testGenerateQuizDocument();
    
    console.log('\nDone testing APIs.');
    process.exit(0);
}

runTests();
