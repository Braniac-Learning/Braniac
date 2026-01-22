/**
 * Question Mode Definitions
 * Determines what types of questions to ask based on category and focus
 */

const QUESTION_MODES = {
  academic: {
    general: [
      "Application",
      "Analysis", 
      "Comparison",
      "Evaluation",
      "Synthesis"
    ],
    historical: [
      "Timeline",
      "Impact Analysis",
      "Biographical",
      "Evolution",
      "Cause and Effect"
    ],
    "problem-solving": [
      "Calculation",
      "Application",
      "Proof",
      "Real-world Problem",
      "Conceptual Understanding"
    ],
    analytical: [
      "Critical Analysis",
      "Evaluation",
      "Interpretation",
      "Comparison"
    ]
  },
  
  fiction: {
    general: [
      "Character Analysis",
      "Plot Understanding",
      "Theme Exploration",
      "Symbolism"
    ],
    fandom: [
      "Power Ranking",
      "Controversial Debate",
      "Character Matchup",
      "Arc Comparison",
      "Memorable Moments"
    ],
    analytical: [
      "Character Development",
      "Narrative Structure",
      "Thematic Analysis",
      "Plot Significance"
    ]
  },
  
  historical: {
    general: [
      "Chronological Events",
      "Key Figures",
      "Cause and Effect",
      "Historical Significance",
      "Comparison"
    ],
    analytical: [
      "Impact Analysis",
      "Multiple Perspectives",
      "Long-term Effects",
      "Historical Context"
    ]
  },
  
  technical: {
    general: [
      "Implementation",
      "Best Practices",
      "Troubleshooting",
      "Optimization",
      "Comparison"
    ],
    historical: [
      "Evolution",
      "Key Innovations",
      "Pioneers",
      "Paradigm Shifts"
    ],
    "problem-solving": [
      "Code Analysis",
      "Debugging",
      "Algorithm Design",
      "Performance Optimization"
    ]
  },
  
  document: {
    general: [
      "Content Analysis",
      "Evaluation",
      "Inference",
      "Application",
      "Synthesis"
    ]
  }
};

/**
 * Get question modes for category and focus
 * @param {string} category - Topic category
 * @param {string} focus - Topic focus
 * @returns {Array<string>} Array of question mode strings
 */
function getQuestionModes(category, focus) {
  const categoryModes = QUESTION_MODES[category];
  
  if (!categoryModes) {
    return QUESTION_MODES.academic.general;
  }
  
  const focusModes = categoryModes[focus];
  
  if (!focusModes) {
    return categoryModes.general || QUESTION_MODES.academic.general;
  }
  
  return focusModes;
}

module.exports = {
  QUESTION_MODES,
  getQuestionModes
};
