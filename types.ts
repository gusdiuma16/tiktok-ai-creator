
export interface StoryCard {
  id: string;
  text: string;
  vibe: string;
  bgGradient: string;
  iconName: string;
  fontFamily: 'Inter' | 'Playfair Display' | 'Bebas Neue' | 'Montserrat' | 'Outfit' | 'Space Grotesk' | 'Cormorant Garamond' | 'Plus Jakarta Sans';
  fontWeight: 'normal' | 'medium' | 'semibold';
  alignment: 'left' | 'center' | 'right';
  textColor: string;
  highlightColor: string; 
  emojis: string[]; // Relevant emojis for the card content
  accentColor: string; // Transparent accent color for decorative blobs
}

export interface GenerationResponse {
  cards: StoryCard[];
}

export interface HistorySession {
  id: string;
  timestamp: number;
  prompt: string;
  cards: StoryCard[];
}