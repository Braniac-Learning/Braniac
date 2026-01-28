/**
 * Document Classification Module
 * Analyzes document content to determine type and characteristics
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Use AI to deeply analyze document content and determine its type
 * @param {string} content - Document text content
 * @returns {Promise<Object>} AI classification result
 */
async function classifyDocumentWithAI(content) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  
  // Take a representative sample of the document
  const sample = content.length > 3000 ? content.substring(0, 3000) : content;
  
  const prompt = `Analyze this document and determine its type and characteristics. Read and understand the content carefully.

DOCUMENT CONTENT:
${sample}

Respond with ONLY valid JSON (no markdown, no explanations):
{
  "primaryType": "mathematical" | "narrative" | "spelling" | "religious" | "historical" | "scientific" | "instructional" | "general",
  "confidence": 0.0-1.0,
  "isMathCalculationHeavy": true/false (only if mathematical),
  "topics": ["main topic 1", "main topic 2"],
  "description": "one sentence describing what this document is about"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Remove markdown code blocks if present
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const classification = JSON.parse(jsonText);
    
    console.log('🤖 AI Classification:', classification);
    return classification;
  } catch (error) {
    console.error('❌ AI classification failed:', error.message);
    return null;
  }
}

/**
 * Classify document type and content characteristics using pattern matching (fallback)
 * @param {string} content - Document text content
 * @returns {Object} Classification result
 */
function classifyDocument(content) {
  const contentLower = content.toLowerCase();
  const totalWords = content.split(/\s+/).length;
  const totalLines = content.split('\n').length;
  
  // Scan entire document for pattern analysis
  const sample = content;
  
  // Detection patterns
  const patterns = {
    // Mathematical content indicators
    mathematical: /(?:solve|calculate|equation|formula|theorem|proof|derivative|integral|\d+\s*[+\-×÷=]\s*\d+|x\s*=|y\s*=|f\(x\)|sum of|product of|quotient|remainder)/gi,
    
    // Spelling/language handbook indicators
    spelling: /(?:spell|spelling|phonetic|pronunciation|syllable|vowel|consonant|alphabet|correct spelling|incorrect spelling|ˈ|ː|ɪ|ə)/gi,
    
    // Narrative/story indicators
    narrative: /(?:once upon|chapter \d+|said|replied|asked|thought|felt|suddenly|meanwhile|character|protagonist|plot)/gi,
    
    // Religious text indicators
    religious: /(?:verse|chapter|testament|scripture|gospel|epistle|genesis|exodus|leviticus|matthew|mark|luke|john|psalm|proverb|lord|god|jesus|prophet|commandment|blessed|amen)/gi,
    
    // Historical document indicators
    historical: /(?:\d{3,4}\s*(?:BC|AD|BCE|CE)|century|era|period|dynasty|empire|war|treaty|revolution|king|queen|emperor)/gi,
    
    // Scientific indicators
    scientific: /(?:hypothesis|experiment|observation|conclusion|methodology|data|analysis|result|specimen|theory|research|study)/gi,
    
    // Instructional/procedural indicators
    instructional: /(?:step \d+|first|second|third|then|next|finally|procedure|instructions|how to|guide|tutorial|follow these)/gi
  };
  
  // Count matches for each pattern
  const scores = {};
  for (const [type, pattern] of Object.entries(patterns)) {
    const matches = content.match(pattern) || [];
    scores[type] = matches.length;
  }
  
  // Calculate density (matches per 1000 words)
  const densities = {};
  for (const [type, score] of Object.entries(scores)) {
    densities[type] = (score / totalWords) * 1000;
  }
  
  // Determine primary type
  let primaryType = 'general';
  let maxDensity = 0;
  
  for (const [type, density] of Object.entries(densities)) {
    if (density > maxDensity && density > 2) { // Threshold: 2 matches per 1000 words
      maxDensity = density;
      primaryType = type;
    }
  }
  
  // Calculate calculation ratio for math documents
  let calculationRatio = 0;
  if (primaryType === 'mathematical') {
    const calculationPatterns = /(?:\d+\s*[+\-×÷=]\s*\d+|solve|calculate|find\s+(?:x|y|the\s+value))/gi;
    const conceptPatterns = /(?:definition|concept|property|characteristic|theorem|theory|principle)/gi;
    
    const calcMatches = (content.match(calculationPatterns) || []).length;
    const conceptMatches = (content.match(conceptPatterns) || []).length;
    
    calculationRatio = calcMatches / (calcMatches + conceptMatches + 1);
  }
  
  // Detect if it's a mixed document
  const significantTypes = Object.entries(densities)
    .filter(([_, density]) => density > 2)
    .map(([type, _]) => type);
  
  const isMixed = significantTypes.length > 1;
  
  // Analyze structure
  const hasChapters = /chapter\s+\d+/i.test(content);
  const hasSections = /(?:section|part)\s+\d+/i.test(content);
  const hasVerses = /verse\s+\d+|\d+:\d+/i.test(content);
  
  console.log('\n📄 Document Classification (Pattern-Based):');
  console.log(`   Type: ${primaryType}${isMixed ? ' (mixed)' : ''}`);
  console.log(`   Length: ${totalWords} words, ${totalLines} lines`);
  console.log(`   Calculation ratio: ${(calculationRatio * 100).toFixed(1)}%`);
  console.log(`   Structure: ${hasChapters ? 'chapters' : hasSections ? 'sections' : hasVerses ? 'verses' : 'continuous'}`);
  
  return {
    primaryType,
    isMixed,
    mixedTypes: isMixed ? significantTypes : [],
    calculationRatio,
    structure: {
      hasChapters,
      hasSections,
      hasVerses,
      totalWords,
      totalLines
    },
    densities,
    confidence: maxDensity
  };
}

/**
 * Main classification function - tries AI first, falls back to pattern matching
 * @param {string} content - Document text content
 * @returns {Promise<Object>} Classification result
 */
async function classifyDocumentSmart(content) {
  console.log('📖 Scanning document to understand content...');
  
  // Try AI-powered classification first
  const aiResult = await classifyDocumentWithAI(content);
  if (aiResult && aiResult.primaryType) {
    console.log('✅ AI successfully analyzed document content');
    
    // Enhance with pattern-based calculation ratio for math docs
    if (aiResult.primaryType === 'mathematical') {
      const patternResult = classifyDocument(content);
      aiResult.calculationRatio = patternResult.calculationRatio;
      aiResult.structure = patternResult.structure;
    }
    
    return aiResult;
  }
  
  // Fallback to pattern matching if AI fails
  console.log('⚠️ Using pattern-based analysis as fallback');
  return classifyDocument(content);
}

module.exports = { 
  classifyDocument,
  classifyDocumentSmart,
  classifyDocumentWithAI
};
