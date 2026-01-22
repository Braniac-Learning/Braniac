/**
 * Subdomain Definitions
 * Maps subject areas to specific subdomains for diverse question generation
 */

const GENERIC_SUBDOMAINS = [
  "Core concepts",
  "Applications",
  "Implications",
  "Limitations",
  "Debates and controversies"
];

const DOMAIN_SUBDOMAINS = {
  mathematics: [
    "Algebra",
    "Geometry", 
    "Calculus",
    "Trigonometry",
    "Probability and Statistics",
    "Number Theory",
    "Linear Algebra",
    "Graph Theory"
  ],
  physics: [
    "Mechanics",
    "Thermodynamics",
    "Electromagnetism",
    "Optics",
    "Modern Physics",
    "Quantum Mechanics",
    "Relativity"
  ],
  chemistry: [
    "Organic Chemistry",
    "Inorganic Chemistry",
    "Physical Chemistry",
    "Analytical Chemistry",
    "Biochemistry"
  ],
  biology: [
    "Cell Biology",
    "Genetics",
    "Evolution",
    "Ecology",
    "Physiology",
    "Molecular Biology"
  ],
  "computer science": [
    "Algorithms",
    "Data Structures",
    "Software Engineering",
    "Operating Systems",
    "Networks",
    "Databases"
  ],
  programming: [
    "Syntax and Basics",
    "Data Structures",
    "Algorithms",
    "Design Patterns",
    "Best Practices",
    "Debugging"
  ],
  history: [
    "Ancient Period",
    "Medieval Period",
    "Modern Era",
    "Contemporary History",
    "Social History",
    "Political History"
  ],
  // Anime/Fiction
  "jujutsu kaisen": [
    "Shibuya Incident Arc",
    "Culling Games Arc",
    "Character Power Scaling",
    "Domain Expansions",
    "Cursed Techniques",
    "Character Relationships",
    "Plot Twists",
    "Fandom Debates"
  ],
  naruto: [
    "Part 1 Events",
    "Shippuden Arc",
    "Character Development",
    "Power System",
    "Relationships",
    "Battles and Strategy",
    "Philosophy and Themes"
  ],
  "one piece": [
    "East Blue Saga",
    "Grand Line Adventures",
    "New World Arc",
    "Devil Fruits",
    "Character Backstories",
    "World Building",
    "Power Scaling"
  ]
};

/**
 * Get subdomains for a given subject area
 * @param {string} subjectArea - The subject area
 * @returns {Array<string>} Array of subdomain strings
 */
function getSubdomains(subjectArea) {
  const normalized = subjectArea.toLowerCase().trim();
  
  // Check for exact match
  if (DOMAIN_SUBDOMAINS[normalized]) {
    return DOMAIN_SUBDOMAINS[normalized];
  }
  
  // Check for partial match (e.g., "jjk" matches "jujutsu kaisen")
  for (const [key, value] of Object.entries(DOMAIN_SUBDOMAINS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  // Fallback to generic
  return GENERIC_SUBDOMAINS;
}

module.exports = {
  GENERIC_SUBDOMAINS,
  DOMAIN_SUBDOMAINS,
  getSubdomains
};
