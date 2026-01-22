/**
 * Context Resolution Module
 * Determines subdomains and question modes based on classification
 */

const { getSubdomains } = require('../logic/subdomains');
const { getQuestionModes } = require('../logic/questionModes');

/**
 * Resolve context from classification
 * @param {Object} classification - Topic classification
 * @returns {Object} { subdomains, modes }
 */
function resolveContext(classification) {
  const { subjectArea, category, focus } = classification;
  
  // Get subdomains for this subject
  const subdomains = getSubdomains(subjectArea);
  
  // Get question modes for category and focus
  const modes = getQuestionModes(category, focus);
  
  console.log(`📋 Context resolved:`);
  console.log(`   Subdomains (${subdomains.length}): ${subdomains.slice(0, 3).join(', ')}...`);
  console.log(`   Question modes (${modes.length}): ${modes.join(', ')}`);
  
  return { subdomains, modes };
}

module.exports = { resolveContext };
