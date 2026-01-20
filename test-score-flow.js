#!/usr/bin/env node
/**
 * Score Flow Testing Guide
 * 
 * This script helps you verify that scores are being saved correctly
 */

const BACKEND_URL = 'https://braniac-backend.onrender.com';

console.log('🧪 SCORE REGISTRATION TEST GUIDE\n');
console.log('═══════════════════════════════════════════════════════\n');

console.log('📋 STEPS TO TEST:\n');

console.log('1️⃣  SIGN IN TO YOUR FRONTEND');
console.log('   - Go to your deployed frontend (Netlify/Render/Vercel)');
console.log('   - Sign in with your credentials');
console.log('   - Make sure you see "Sign Out" button\n');

console.log('2️⃣  OPEN BROWSER DEVTOOLS');
console.log('   - Press F12 or Cmd+Option+I (Mac)');
console.log('   - Go to "Console" tab');
console.log('   - Go to "Network" tab\n');

console.log('3️⃣  START A QUIZ');
console.log('   - Choose any topic (or upload a document)');
console.log('   - Select difficulty');
console.log('   - Start the quiz\n');

console.log('4️⃣  COMPLETE THE QUIZ');
console.log('   - Answer all questions');
console.log('   - Click "Finish Quiz"\n');

console.log('5️⃣  CHECK CONSOLE OUTPUT');
console.log('   Look for these messages:');
console.log('   ✅ "Score saved successfully"');
console.log('   ✅ Response with score data');
console.log('   ❌ If you see CORS errors, backend needs redeployment\n');

console.log('6️⃣  CHECK NETWORK TAB');
console.log('   - Look for POST request to:', BACKEND_URL + '/api/user/score');
console.log('   - Status should be: 200 OK');
console.log('   - Response should show: { ok: true, data: {...} }\n');

console.log('7️⃣  CHECK BACKEND LOGS (Render Dashboard)');
console.log('   - Go to: https://dashboard.render.com');
console.log('   - Find your backend service');
console.log('   - Click "Logs" tab');
console.log('   - Look for:');
console.log('     📥 "Received score submission"');
console.log('     🔄 "updateUserScore called for: [username]"');
console.log('     📊 "Score data: {...}"');
console.log('     ✅ "saveUserData completed: Success"\n');

console.log('8️⃣  CHECK MONGODB DATABASE');
console.log('   - Go to: https://cloud.mongodb.com');
console.log('   - Select your cluster');
console.log('   - Click "Browse Collections"');
console.log('   - Navigate to: braniac_db → userData');
console.log('   - Find your username document');
console.log('   - Verify these fields exist:');
console.log('     ✅ scores: [ { topic, score, date, ... } ]');
console.log('     ✅ quizzesTaken: number');
console.log('     ✅ uniqueSubjects: [...]');
console.log('     ✅ learningDays: [...]');
console.log('     ✅ logicQuizzes: number');
console.log('     ✅ perfectScores: number');
console.log('     ✅ maxConsecutiveCorrect: number');
console.log('     ✅ masteredSubjects: [...]\n');

console.log('9️⃣  CHECK ACHIEVEMENTS PAGE');
console.log('   - Go to achievements page on your frontend');
console.log('   - Check if "First Steps" is unlocked (✓)');
console.log('   - Check progress on other achievements\n');

console.log('═══════════════════════════════════════════════════════\n');

console.log('🔍 TROUBLESHOOTING:\n');

console.log('❌ If scores are NOT saving:');
console.log('   1. Check CORS errors in browser console');
console.log('   2. Verify backend redeployed with latest code');
console.log('   3. Check if you\'re actually logged in (not guest)');
console.log('   4. Verify backend URL in frontend matches:', BACKEND_URL);
console.log('   5. Check MongoDB connection in backend logs\n');

console.log('❌ If achievements are NOT showing:');
console.log('   1. Check browser console for API errors');
console.log('   2. Verify achievements-logic.js is loaded');
console.log('   3. Check Network tab for /api/user/data request');
console.log('   4. Make sure you completed at least 1 quiz\n');

console.log('💡 QUICK API TEST:\n');
console.log('Run this command after taking a quiz:');
console.log(`curl -X GET '${BACKEND_URL}/api/user/data' \\\n     -H 'Cookie: session=[your-cookie]' \\\n     --cookie-jar cookies.txt`);
console.log('\nThis will show your current userData from the database\n');

console.log('═══════════════════════════════════════════════════════\n');
console.log('✅ Backend Status: ONLINE');
console.log('🌐 Backend URL:', BACKEND_URL);
console.log('📊 MongoDB: Connected (check Render logs to confirm)');
console.log('🎯 Ready to test!\n');
