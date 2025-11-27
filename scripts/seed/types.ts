/**
 * Type definitions for seeding scripts
 */

export interface VectorRecord {
  id: string;
  values: number[];
  metadata: {
    word: string;
    category: string;
    language: string;
  };
}

export interface WordsByLanguage extends Map<string, Set<string>> {}
