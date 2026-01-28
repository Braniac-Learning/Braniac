/**
 * Question Strategy Definitions by Document Type
 * Defines what types of questions to ask for each document category
 */

const QUESTION_STRATEGIES = {
  mathematical: {
    high_calculation: {
      // 80%+ calculation content - focus almost entirely on problems
      types: [
        { type: 'calculation', weight: 70, description: 'Solve problems using document concepts' },
        { type: 'application', weight: 20, description: 'Apply formulas to new scenarios' },
        { type: 'conceptual', weight: 10, description: 'Test understanding of principles' }
      ],
      guidelines: [
        'Create NEW problems inspired by document examples',
        'Never copy problems verbatim from the document',
        'Use different numbers and contexts',
        'Scale complexity based on difficulty level',
        'Include multi-step problems at higher difficulties'
      ]
    },
    moderate_calculation: {
      // 40-80% calculation content - balanced approach
      types: [
        { type: 'calculation', weight: 50, description: 'Solve problems' },
        { type: 'conceptual', weight: 30, description: 'Understand definitions and properties' },
        { type: 'application', weight: 20, description: 'Apply concepts' }
      ]
    },
    low_calculation: {
      // <40% calculation - theory-focused
      types: [
        { type: 'conceptual', weight: 50, description: 'Definitions and theorems' },
        { type: 'calculation', weight: 30, description: 'Simple calculations' },
        { type: 'historical', weight: 20, description: 'Mathematical history' }
      ]
    }
  },
  
  narrative: {
    types: [
      { type: 'plot_events', weight: 25, description: 'What happened and why' },
      { type: 'character_analysis', weight: 25, description: 'Motivations and relationships' },
      { type: 'thematic', weight: 20, description: 'Themes and implications' },
      { type: 'causal', weight: 15, description: 'Cause and effect relationships' },
      { type: 'author_context', weight: 10, description: 'Author and background' },
      { type: 'symbolic', weight: 5, description: 'Symbolism and deeper meaning' }
    ],
    guidelines: [
      'Ask about specific events from different parts of the story',
      'Explore character motivations and relationships',
      'Avoid generic "summarize" questions',
      'Reference specific chapters or scenes',
      'Scale obscurity with difficulty'
    ]
  },
  
  spelling: {
    types: [
      { type: 'gap_fill', weight: 30, description: 'Fill in missing letters (e.g., ab_nd_n)' },
      { type: 'phonetic', weight: 25, description: 'Spell from pronunciation (e.g., /ˈbaɪbəl/)' },
      { type: 'multiple_choice', weight: 20, description: 'Choose correct spelling' },
      { type: 'pattern', weight: 15, description: 'Apply spelling patterns' },
      { type: 'syllable', weight: 10, description: 'Syllable identification' }
    ],
    guidelines: [
      'Use words FROM the document',
      'Create active spelling challenges',
      'Include phonetic transcriptions when possible',
      'Vary difficulty by word complexity',
      'Avoid passive definition questions'
    ]
  },
  
  religious: {
    types: [
      { type: 'verse_content', weight: 30, description: 'What was said/commanded in verses' },
      { type: 'character_lineage', weight: 20, description: 'Family relationships and lineage' },
      { type: 'event_location', weight: 20, description: 'Where events occurred' },
      { type: 'actions_consequences', weight: 15, description: 'Actions and their outcomes' },
      { type: 'teaching', weight: 15, description: 'Core teachings and principles' }
    ],
    guidelines: [
      'Reference specific verses or chapters',
      'Ask about key figures and their relationships',
      'Focus on events and their significance',
      'Respect the text - avoid trivialization',
      'Scale from general themes to specific verse details'
    ]
  },
  
  historical: {
    types: [
      { type: 'events', weight: 30, description: 'What happened and when' },
      { type: 'causal', weight: 25, description: 'Causes and effects' },
      { type: 'figures', weight: 20, description: 'Key people and their roles' },
      { type: 'contextual', weight: 15, description: 'Historical context' },
      { type: 'significance', weight: 10, description: 'Impact and legacy' }
    ]
  },
  
  scientific: {
    types: [
      { type: 'process', weight: 30, description: 'Experimental procedures' },
      { type: 'analysis', weight: 25, description: 'Data interpretation' },
      { type: 'conceptual', weight: 20, description: 'Scientific concepts' },
      { type: 'application', weight: 15, description: 'Apply knowledge' },
      { type: 'methodology', weight: 10, description: 'Scientific method' }
    ]
  },
  
  instructional: {
    types: [
      { type: 'sequence', weight: 35, description: 'Order of steps' },
      { type: 'application', weight: 30, description: 'Apply procedures' },
      { type: 'purpose', weight: 20, description: 'Why steps are necessary' },
      { type: 'troubleshooting', weight: 15, description: 'Handle problems' }
    ]
  },
  
  general: {
    types: [
      { type: 'comprehension', weight: 35, description: 'Main ideas' },
      { type: 'detail', weight: 30, description: 'Specific information' },
      { type: 'inference', weight: 20, description: 'Reading between lines' },
      { type: 'vocabulary', weight: 15, description: 'Word meanings' }
    ]
  }
};

/**
 * Get question strategy for a document classification
 */
function getQuestionStrategy(classification) {
  const { primaryType, calculationRatio } = classification;
  
  if (primaryType === 'mathematical') {
    // Select strategy based on calculation ratio
    if (calculationRatio > 0.8) {
      return QUESTION_STRATEGIES.mathematical.high_calculation;
    } else if (calculationRatio > 0.4) {
      return QUESTION_STRATEGIES.mathematical.moderate_calculation;
    } else {
      return QUESTION_STRATEGIES.mathematical.low_calculation;
    }
  }
  
  return QUESTION_STRATEGIES[primaryType] || QUESTION_STRATEGIES.general;
}

/**
 * Distribute question types across count
 */
function distributeQuestionTypes(strategy, questionCount) {
  const distribution = [];
  const types = strategy.types;
  
  // Calculate how many questions per type based on weights
  let remaining = questionCount;
  
  for (let i = 0; i < types.length && remaining > 0; i++) {
    const type = types[i];
    const proportion = type.weight / 100;
    const count = Math.max(1, Math.round(questionCount * proportion));
    const actual = Math.min(count, remaining);
    
    for (let j = 0; j < actual; j++) {
      distribution.push({
        type: type.type,
        description: type.description
      });
    }
    
    remaining -= actual;
  }
  
  // Fill remaining with most common type
  while (remaining > 0) {
    distribution.push({
      type: types[0].type,
      description: types[0].description
    });
    remaining--;
  }
  
  // Shuffle to avoid predictable patterns
  for (let i = distribution.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [distribution[i], distribution[j]] = [distribution[j], distribution[i]];
  }
  
  return distribution;
}

module.exports = {
  QUESTION_STRATEGIES,
  getQuestionStrategy,
  distributeQuestionTypes
};
