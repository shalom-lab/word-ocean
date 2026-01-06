export interface WordTranslation {
  translation: string;
  type: string;
}

export interface Phrase {
  phrase: string;
  translation: string;
}

export interface WordData {
  word: string;
  translations: WordTranslation[];
  phrases: Phrase[];
}

export interface WordNode {
  id: number;
  word: string;
  mean: string;
  vector: number[];
  root: string | null;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  translations: WordTranslation[];
  phrases: Phrase[];
}

export interface Link {
  source: number;
  target: number;
  type: 'root' | 'spelling' | 'semantic';
  color: string;
  strength: number;
}

export interface DictionaryStats {
  rootsFound: number;
  vectorLinks: number;
  similarLinks: number;
  rootLinks: number;
}

export type DictionaryName = 
  | '1-初中-顺序'
  | '2-高中-顺序'
  | '3-CET4-顺序'
  | '4-CET6-顺序'
  | '5-考研-顺序'
  | '6-托福-顺序'
  | '7-SAT-顺序';

