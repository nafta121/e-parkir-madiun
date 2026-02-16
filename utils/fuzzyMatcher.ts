/**
 * Fuzzy Matching Utility using Levenshtein Distance
 * Matches "Jalan Sekar Tejo" with "Jl. Sekartejo" by normalizing and scoring.
 */

// 1. Normalize: Lowercase, Remove Prefixes/Punctuation, Remove Spaces
const normalizeString = (raw: string): string => {
  if (!raw) return '';
  
  let str = raw.toLowerCase();

  // Remove punctuation (.,)
  str = str.replace(/[.,]/g, '');

  // Remove common Indonesian prefixes
  // \b ensures we match whole words (e.g. don't match 'jalan' inside 'perjalanan')
  const prefixes = ['jalan', 'jln', 'jl', 'gang', 'gg', 'lorong'];
  const prefixRegex = new RegExp(`\\b(${prefixes.join('|')})\\b`, 'g');
  str = str.replace(prefixRegex, '');

  // Remove ALL spaces to handle "Sekar Tejo" vs "Sekartejo"
  str = str.replace(/\s+/g, '');

  return str;
};

// 2. Levenshtein Distance Calculation
const levenshteinDistance = (a: string, b: string): number => {
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

// 3. Main Matching Function
export const findClosestMatch = (gpsStreet: string, dbStreets: string[]): string | null => {
  const normGPS = normalizeString(gpsStreet);
  console.log(`🔍 [FuzzyMatcher] GPS Input: "${gpsStreet}" -> Normalized: "${normGPS}"`);

  if (!normGPS) return null;

  let bestMatch: string | null = null;
  let highestScore = 0;

  for (const dbStreet of dbStreets) {
    const normDB = normalizeString(dbStreet);
    
    // Calculate Score (0.0 to 1.0)
    let score = 0;
    if (normGPS === normDB) {
      score = 1.0;
    } else {
      const distance = levenshteinDistance(normGPS, normDB);
      const longest = Math.max(normGPS.length, normDB.length);
      score = longest === 0 ? 0 : 1.0 - distance / longest;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = dbStreet;
    }
  }

  console.log(`🎯 [FuzzyMatcher] Best Match: "${bestMatch}" | Score: ${highestScore.toFixed(2)}`);

  // Threshold: Matches below 0.4 are considered too weak
  // Example: "Jalan A" vs "Jalan B" might have score around 0.3-0.5 depending on length.
  // We want to be reasonably sure.
  const THRESHOLD = 0.4;

  if (highestScore >= THRESHOLD && bestMatch) {
    return bestMatch;
  }

  return null;
};