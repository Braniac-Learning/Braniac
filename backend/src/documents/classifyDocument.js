/**
 * Document Classification Module
 * Analyzes document content to determine type and characteristics
 */

/**
 * Classify document type and content characteristics
 * @param {string} content - Document text content
 * @returns {Object} Classification result
 */
function classifyDocument(content) {
  const contentLower = content.toLowerCase();
  const totalWords = content.split(/\s+/).length;
  const totalLines = content.split('\n').length;
  
  // Sample first 2000 characters for quick analysis
  const sample = content.substring(0, 2000).toLowerCase();
  
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
  
  console.log('\n📄 Document Classification:');
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

module.exports = { classifyDocument };
