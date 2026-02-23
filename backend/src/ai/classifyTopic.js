/**
 * Topic Classification Module
 * Determines topic category, focus, and restrictions
 */

async function classifyTopic(topicInput, apiKey) {
  const prompt = `Analyze and classify this topic. Return ONLY valid JSON with NO markdown formatting.

Topic: "${topicInput}"

Required JSON structure:
{
  "topic": "cleaned topic name",
  "category": "one of: academic, fiction, historical, technical, document",
  "focus": "one of: general, historical, analytical, fandom, meta, problem-solving",
  "subjectArea": "specific domain like mathematics, physics, anime, history",
  "restrictions": []
}

Classification rules:
- If topic mentions "history of X" or "evolution of X": focus = "historical"
- If topic is anime/show/game: category = "fiction"
- If topic is math/science without "history": focus = "problem-solving"
- If topic asks about fandom/debates: focus = "fandom"
- subjectArea should be the core subject (e.g., "mathematics", "jujutsu kaisen", "physics")

Return ONLY the JSON object, nothing else.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 256
        }
      })
    });

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from response (remove markdown if present)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Invalid classification response');
  } catch (error) {
    console.error('❌ Classification error:', error);
    // Fallback classification
    return {
      topic: topicInput,
      category: 'academic',
      focus: 'general',
      subjectArea: topicInput.toLowerCase(),
      restrictions: []
    };
  }
}

module.exports = { classifyTopic };
