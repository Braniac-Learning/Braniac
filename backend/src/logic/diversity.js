/**
 * Diversity Enforcement Module
 * Prevents repetitive questions by tracking history and forcing variety
 */

/**
 * Pick a unique item from options that hasn't been used recently
 * @param {Array} options - Available options
 * @param {Array} history - Recent history of selections
 * @param {string} key - Key to check in history objects
 * @returns {*} Selected option
 */
function pickUnique(options, history = [], key) {
  if (options.length === 0) {
    return null;
  }
  
  if (history.length === 0) {
    return options[0];
  }
  
  // Get last 2-3 used values
  const recentCount = Math.min(3, Math.floor(options.length / 2));
  const recent = history.slice(-recentCount).map(h => h[key]);
  
  // Find first option not in recent history
  const unused = options.find(o => !recent.includes(o));
  
  return unused || options[0];
}

/**
 * Distribute items evenly across count
 * @param {Array} items - Items to distribute
 * @param {number} count - How many to pick
 * @returns {Array} Evenly distributed selection
 */
function distributeEvenly(items, count) {
  if (count >= items.length) {
    return [...items];
  }
  
  const step = items.length / count;
  const result = [];
  
  for (let i = 0; i < count; i++) {
    const index = Math.floor(i * step);
    result.push(items[index]);
  }
  
  return result;
}

/**
 * Create question distribution plan
 * @param {Array} subdomains - Available subdomains
 * @param {Array} modes - Available question modes
 * @param {number} questionCount - Total questions to generate
 * @param {Array} history - Previous generations
 * @returns {Array} Plan array with subdomain and mode for each question
 */
function createDistributionPlan(subdomains, modes, questionCount, history = []) {
  const plan = [];
  
  // Distribute subdomains
  const subdomainDistribution = distributeEvenly(subdomains, questionCount);
  
  // Distribute modes
  const modeDistribution = distributeEvenly(modes, questionCount);
  
  for (let i = 0; i < questionCount; i++) {
    // Pick subdomain and mode, avoiding recent history
    const subdomain = pickUnique(
      [subdomainDistribution[i], ...subdomains.filter(s => s !== subdomainDistribution[i])],
      [...history, ...plan],
      'subdomain'
    );
    
    const mode = pickUnique(
      [modeDistribution[i], ...modes.filter(m => m !== modeDistribution[i])],
      [...history, ...plan],
      'mode'
    );
    
    plan.push({
      questionNumber: i + 1,
      subdomain,
      mode
    });
  }
  
  return plan;
}

module.exports = {
  pickUnique,
  distributeEvenly,
  createDistributionPlan
};
