/**
 * Smart String Matching Utility for Indonesian Street Names
 * Focuses on the "Core Name" by removing prefixes and spacing.
 */

// 1. Normalize String: Lowercase, Remove Prefixes, Remove Punctuation, Remove ALL Spaces
export const normalizeString = (raw: string): string => {
  if (!raw) return '';
  
  let str = raw.toLowerCase();

  // Remove punctuation (.,)
  str = str.replace(/[.,]/g, '');

  // Remove common Indonesian prefixes
  // \b ensures we match whole words (e.g. don't match 'jalan' inside 'perjalanan')
  const prefixes = ['jalan', 'jln', 'jl', 'gang', 'gg', 'lorong'];
  const prefixRegex = new RegExp(`\\b(${prefixes.join('|')})\\b`, 'g');
  str = str.replace(prefixRegex, '');

  // CRITICAL: Remove ALL spaces to handle "Sekar Tejo" vs "Sekartejo"
  str = str.replace(/\s+/g, '');

  return str;
};

// 2. Levenshtein Distance Algorithm (Standard Implementation)
export const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1,   // insertion
            matrix[i - 1][j] + 1    // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

// 3. Calculate Similarity Percentage (0.0 to 1.0)
export const calculateSimilarity = (a: string, b: string): number => {
  if (a === b) return 1.0;
  if (a.length === 0 || b.length === 0) return 0.0;

  const distance = levenshteinDistance(a, b);
  const longest = Math.max(a.length, b.length);
  return 1.0 - distance / longest;
};

// 4. Find Best Match
export interface SmartMatchResult {
  matchedName: string | null;
  score: number;
}

export const findBestStreetMatch = (gpsStreet: string, dbStreets: string[]): SmartMatchResult => {
  const normGPS = normalizeString(gpsStreet);
  console.log(`🔍 [SmartMatcher] Normalized GPS: "${gpsStreet}" -> "${normGPS}"`);

  let bestMatch: string | null = null;
  let highestScore = 0;

  for (const dbStreet of dbStreets) {
    const normDB = normalizeString(dbStreet);
    const score = calculateSimilarity(normGPS, normDB);

    // Debug log for close calls to help analyze false negatives
    if (score > 0.6) {
      console.log(`   Compare DB: "${dbStreet}" -> "${normDB}" | Score: ${score.toFixed(2)}`);
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = dbStreet;
    }
  }

  // Threshold: 0.75 ensures reasonable similarity (allows 1-2 char differences in short strings)
  const THRESHOLD = 0.75;

  return {
    matchedName: highestScore >= THRESHOLD ? bestMatch : null,
    score: highestScore,
  };
};
