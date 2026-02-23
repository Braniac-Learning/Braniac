/**
 * Document Question Generation Module
 * Generates contextual questions based on document type and strategy
 */

/**
 * Generate a question based on document type and question type
 */
async function generateDocumentQuestion({
  documentType,
  questionType,
  content,
  difficulty,
  sectionHint,
  apiKey
}) {
  
  const difficultyDescriptions = {
    beginner: 'basic, straightforward - surface-level understanding',
    intermediate: 'moderate depth - requires understanding and connection',
    advanced: 'deep analysis - multi-step reasoning and synthesis',
    expert: 'highly sophisticated - obscure details and complex inference'
  };
  
  // Build type-specific prompts
  const typePrompts = {
    // Mathematical questions
    calculation: `Create a calculation/problem-solving question.
- Use concepts FROM the document but create a NEW problem
- Use DIFFERENT numbers and scenarios than document examples
- Never copy problems verbatim
- Make it solvable using document principles`,
    
    // Narrative questions
    plot_events: `Ask about SPECIFIC events from the story.
- Reference particular chapters or scenes
- Ask what happened and why
- Focus on key turning points`,
    
    character_analysis: `Ask about character motivations, relationships, or development.
- Reference specific actions or decisions
- Explore why characters behaved certain ways
- Ask about relationships between characters`,
    
    // Spelling questions
    gap_fill: `Create a gap-fill spelling question using a word from the document.
- Format: word with missing letters (e.g., "ab_nd_n" for abandon)
- Remove 1-3 letters strategically
- Make it challenging but solvable`,
    
    phonetic: `Create a phonetic spelling question.
- Provide IPA pronunciation (e.g., /ˈbaɪbəl/)
- Ask user to spell the word
- Use words that appear in the document`,
    
    // Religious text questions
    verse_content: `Ask what was said or commanded in a SPECIFIC verse or chapter.
- Reference exact verse numbers
- Ask about the content or teaching
- Be respectful and specific`,
    
    character_lineage: `Ask about family relationships or lineage of biblical figures.
- Who were the children/parents/descendants of X?
- Focus on key figures mentioned in the document`,
    
    event_location: `Ask WHERE a specific event occurred.
- Reference the verse or chapter
- Ask about the location mentioned`,
    
    // General fallbacks
    comprehension: `Ask about main ideas or key concepts from a specific section.`,
    detail: `Ask about a specific detail or fact from the document.`,
    conceptual: `Ask about understanding of a concept or principle.`
  };
  
  const typePrompt = typePrompts[questionType] || typePrompts.comprehension;
  
  const prompt = `Generate exactly ONE multiple-choice quiz question from this document.

DOCUMENT TYPE: ${documentType}
QUESTION TYPE: ${questionType}
DIFFICULTY: ${difficultyDescriptions[difficulty] || difficultyDescriptions.intermediate}
${sectionHint ? `FOCUS ON: ${sectionHint}` : ''}

${typePrompt}

LANGUAGE REQUIREMENTS:
- Use SIMPLE, CLEAR English
- Common everyday words
- Basic reading level
- Short, clear sentences

CRITICAL REQUIREMENTS:
- Question must be SPECIFIC to document content
- Reference actual details, events, or examples from the document
- Never ask "What is this document about?"
- Avoid generic meta-questions

FORMAT:
- Exactly 4 options (A, B, C, D)
- Only ONE correct answer
- SHORT options (5-7 words max)
- Use simple words

Document excerpt (use this to create your question):
${content.substring(0, 3000)}

Output ONLY valid JSON:
{
  "question": "Specific question here?",
  "options": {
    "A": "Short option",
    "B": "Short option",
    "C": "Short option",
    "D": "Short option"
  },
  "correct": "A"
}

No markdown, no explanation, ONLY the JSON object.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const question = JSON.parse(jsonMatch[0]);
        console.log(`   ✅ Generated ${questionType} question`);
        return [question];
      } catch (parseError) {
        console.error(`   ❌ JSON parse failed for ${questionType}:`, parseError.message);
        return [];
      }
    } else {
      console.error(`   ❌ No JSON found for ${questionType}`);
      return [];
    }
    
  } catch (error) {
    console.error(`   ❌ Generation failed for ${questionType}:`, error.message);
    return [];
  }
}

/**
 * Generate questions following a distribution plan
 */
async function generateDocumentQuestions({
  classification,
  distribution,
  content,
  difficulty,
  apiKey
}) {
  const allQuestions = [];
  
  console.log(`\n🎲 Generating ${distribution.length} document-based questions...`);
  
  // Split document into chunks for variety
  const wordCount = content.split(/\s+/).length;
  const chunkSize = Math.floor(wordCount / distribution.length);
  
  for (let i = 0; i < distribution.length; i++) {
    const item = distribution[i];
    
    // Get content chunk for this question
    const words = content.split(/\s+/);
    const startWord = i * chunkSize;
    const endWord = Math.min((i + 1) * chunkSize, words.length);
    const chunk = words.slice(startWord, endWord).join(' ');
    
    const questions = await generateDocumentQuestion({
      documentType: classification.primaryType,
      questionType: item.type,
      content: chunk.length > 100 ? chunk : content, // Use full content if chunk too small
      difficulty,
      sectionHint: `section ${i + 1} of the document`,
      apiKey
    });
    
    if (questions && questions.length > 0) {
      allQuestions.push(...questions);
    } else {
      console.log(`   ⚠️ Skipping failed ${item.type} question`);
    }
    
    // Delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log(`✅ Successfully generated ${allQuestions.length}/${distribution.length} questions`);
  
  return allQuestions;
}

module.exports = {
  generateDocumentQuestion,
  generateDocumentQuestions
};
