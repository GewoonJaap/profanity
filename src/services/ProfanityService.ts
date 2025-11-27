import type { 
  Env, 
  ProfanityCheckResult, 
  ProfanityMatch 
} from '../types';
import { 
  generateEmbedding, 
  tokenizeText, 
  isProfaneMatch 
} from '../vectorUtils';

export class ProfanityService {
  constructor(private env: Env) {}

  /**
   * Normalize text to prevent common circumvention techniques
   */
  private normalizeText(text: string): string {
    let normalized = text.toLowerCase();

    // Remove common obfuscation characters
    normalized = normalized
      .replace(/[*@#$%&]+/g, '') // Remove special chars used for obfuscation
      .replace(/[0-9]/g, (match) => {
        // Leet speak conversion
        const leetMap: Record<string, string> = {
          '0': 'o',
          '1': 'i',
          '3': 'e',
          '4': 'a',
          '5': 's',
          '7': 't',
          '8': 'b',
        };
        return leetMap[match] || match;
      })
      .replace(/(\w)\1+/g, '$1') // Remove repeated characters (e.g., "shiiit" -> "shit")
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    return normalized;
  }

  /**
   * Check for zero-width characters and invisible Unicode tricks
   */
  private hasInvisibleCharacters(text: string): boolean {
    const invisibleChars = /[\u200B-\u200D\uFEFF\u00A0]/g;
    return invisibleChars.test(text);
  }

  /**
   * Remove zero-width and invisible characters
   */
  private removeInvisibleCharacters(text: string): string {
    return text.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '');
  }

  /**
   * Generate variations of a word to catch obfuscation
   */
  private generateWordVariations(word: string): string[] {
    const variations = [word];

    // Check word without spaces between characters (e.g., "s h i t" -> "shit")
    const withoutSpaces = word.replace(/\s/g, '');
    if (withoutSpaces !== word) {
      variations.push(withoutSpaces);
    }

    // Check with common substitutions removed
    const withoutSubstitutions = word
      .replace(/[!|]/g, 'i')
      .replace(/\$/g, 's')
      .replace(/@/g, 'a')
      .replace(/\(/g, 'c');
    
    if (withoutSubstitutions !== word) {
      variations.push(withoutSubstitutions);
    }

    return [...new Set(variations)]; // Remove duplicates
  }

  /**
   * Check text for profanity with advanced detection
   */
  async checkProfanity(
    text: string,
    threshold: number = 0.8
  ): Promise<ProfanityCheckResult> {
    // Remove invisible characters first
    const cleanedText = this.removeInvisibleCharacters(text);
    
    // Normalize to prevent circumvention
    const normalizedText = this.normalizeText(cleanedText);
    
    // Tokenize the normalized text
    const words = tokenizeText(normalizedText);
    
    if (words.length === 0) {
      return {
        hasProfanity: false,
        matches: [],
        overallScore: 0,
        text: cleanedText,
      };
    }

    const matches: ProfanityMatch[] = [];
    const checkedWords = new Set<string>();

    // Check each word and its variations
    for (const word of words) {
      if (word.length < 2) continue; // Skip very short words
      if (checkedWords.has(word)) continue;
      
      checkedWords.add(word);
      const variations = this.generateWordVariations(word);
      
      let bestMatch: { score: number; profanity: string } | null = null;

      // Check all variations against vector store
      for (const variation of variations) {
        const embedding = generateEmbedding(variation);
        
        const results = await this.env.VECTORIZE.query(embedding, {
          topK: 1,
          returnValues: false,
          returnMetadata: 'all',
        });

        if (results.matches && results.matches.length > 0) {
          const topMatch = results.matches[0];
          
          if (!bestMatch || topMatch.score > bestMatch.score) {
            bestMatch = {
              score: topMatch.score,
              profanity: topMatch.metadata?.word || topMatch.id,
            };
          }
        }
      }

      if (bestMatch) {
        const isProfane = bestMatch.score >= threshold;
        matches.push({
          word,
          matchScore: bestMatch.score,
          matchedProfanity: bestMatch.profanity,
          isProfane,
        });
      } else {
        matches.push({
          word,
          matchScore: 0,
          matchedProfanity: '',
          isProfane: false,
        });
      }
    }

    // Check for concatenated profanity (e.g., "youareshit")
    const concatenatedMatches = await this.checkConcatenatedProfanity(
      normalizedText,
      threshold
    );
    matches.push(...concatenatedMatches);

    // Calculate overall profanity score
    const profaneMatches = matches.filter(m => m.isProfane);
    const overallScore = matches.length > 0
      ? profaneMatches.reduce((sum, m) => sum + m.matchScore, 0) / matches.length
      : 0;

    return {
      hasProfanity: profaneMatches.length > 0,
      matches,
      overallScore,
      text: cleanedText,
    };
  }

  /**
   * Check for profanity hidden in concatenated text
   */
  private async checkConcatenatedProfanity(
    text: string,
    threshold: number
  ): Promise<ProfanityMatch[]> {
    const matches: ProfanityMatch[] = [];
    const cleanText = text.replace(/\s/g, ''); // Remove all spaces
    
    // Only check if text is reasonably long
    if (cleanText.length < 4 || cleanText.length > 50) {
      return matches;
    }

    // Check sliding windows of different sizes
    for (let windowSize = 3; windowSize <= 8; windowSize++) {
      for (let i = 0; i <= cleanText.length - windowSize; i++) {
        const substring = cleanText.substring(i, i + windowSize);
        const embedding = generateEmbedding(substring);
        
        const results = await this.env.VECTORIZE.query(embedding, {
          topK: 1,
          returnValues: false,
          returnMetadata: 'all',
        });

        if (results.matches && results.matches.length > 0) {
          const topMatch = results.matches[0];
          
          if (isProfaneMatch(topMatch, threshold)) {
            // Check if we haven't already found this match
            const isDuplicate = matches.some(
              m => m.matchedProfanity === (topMatch.metadata?.word || topMatch.id)
            );
            
            if (!isDuplicate) {
              matches.push({
                word: `[hidden: ${substring}]`,
                matchScore: topMatch.score,
                matchedProfanity: topMatch.metadata?.word || topMatch.id,
                isProfane: true,
              });
            }
          }
        }
      }
    }

    return matches;
  }
}
