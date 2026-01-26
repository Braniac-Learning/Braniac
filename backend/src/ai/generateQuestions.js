/**
 * Question Generation Module
 * Generates questions using Gemini with structured context
 */

/**
 * Generate questions for a specific subdomain and mode
 * @param {Object} params - Generation parameters
 * @returns {Promise<Array>} Array of question objects
 */
async function generateQuestionsForContext({ 
  topic, 
  subdomain, 
  mode, 
  difficulty,
  apiKey,
  questionCount = 1
}) {
  const difficultyPrompts = {
    beginner: "BEGINNER level - basic concepts and fundamental principles",
    intermediate: "INTERMEDIATE level - moderate understanding and application", 
    advanced: "ADVANCED level - deep analysis and complex scenarios",
    expert: "EXPERT level - specialized knowledge and critical thinking"
  };

  const prompt = `Generate exactly ${questionCount} multiple-choice quiz question(s).

TOPIC: ${topic}
SUBDOMAIN: ${subdomain}
QUESTION MODE: ${mode}
DIFFICULTY: ${difficultyPrompts[difficulty] || difficultyPrompts.intermediate}

CRITICAL REQUIREMENTS:
1. Question MUST be about the subdomain "${subdomain}"
2. Question MUST use the mode "${mode}"
3. Question MUST be unique and specific
4. DO NOT ask generic questions like "What is ${topic}?"
5. Focus on ${subdomain} specifically, not general ${topic}

LANGUAGE REQUIREMENTS:
- Use SIMPLE, CLEAR English
- Use common everyday words
- Avoid complex vocabulary and jargon
- Write at a basic reading level
- Make questions easy to understand
- Short, clear sentences

FORMAT REQUIREMENTS:
- Exactly 4 answer options (A, B, C, D)
- Only ONE correct answer
- Keep options SHORT (5-7 words maximum)
- Use simple words in options
- Distribute correct answers randomly (don't always use A or B)

Output ONLY valid JSON array:
[
  {
    "question": "Specific question about ${subdomain}?",
    "options": {
      "A": "Short option text",
      "B": "Short option text",
      "C": "Short option text",
      "D": "Short option text"
    },
    "correct": "A",
    "subdomain": "${subdomain}",
    "mode": "${mode}"
  }
]

No markdown, no explanation, ONLY the JSON array.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`   ❌ API Response: ${response.status} - ${errorBody.substring(0, 200)}`);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Try to extract and parse JSON
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const questions = JSON.parse(jsonMatch[0]);
        console.log(`   ✅ Generated ${questions.length} question(s) for ${subdomain} (${mode})`);
        return questions;
      } catch (parseError) {
        console.error(`   ❌ JSON parse failed for ${subdomain}:`, parseError.message);
        console.error(`   Raw text: ${text.substring(0, 200)}...`);
        return [];
      }
    } else {
      console.error(`   ❌ No JSON found in response for ${subdomain}`);
      console.error(`   Raw text: ${text.substring(0, 200)}...`);
      return [];
    }
  } catch (error) {
    console.error(`   ❌ Generation failed for ${subdomain}:`, error.message);
    return [];
  }
}

/**
 * Generate questions following a distribution plan
 * @param {Object} params - Generation parameters
 * @returns {Promise<Array>} All generated questions
 */
async function generateWithPlan({ topic, plan, difficulty, apiKey }) {
  const allQuestions = [];
  
  console.log(`\n🎲 Generating ${plan.length} questions...`);
  
  // Generate questions in batches to avoid rate limits
  for (const item of plan) {
    const questions = await generateQuestionsForContext({
      topic,
      subdomain: item.subdomain,
      mode: item.mode,
      difficulty,
      apiKey,
      questionCount: 1
    });
    
    if (questions && questions.length > 0) {
      allQuestions.push(...questions);
    } else {
      console.log(`   ⚠️ Skipping failed question for ${item.subdomain}`);
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log(`✅ Successfully generated ${allQuestions.length}/${plan.length} questions`);
  
  if (allQuestions.length === 0) {
    console.error(`❌ No questions generated at all - this will trigger fallback\n`);
  }
  
  return allQuestions;
}

module.exports = {
  generateQuestionsForContext,
  generateWithPlan
};
