import { GoogleGenAI, Type } from "@google/genai";
import { GenerationResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateStoryContent = async (userPrompt: string): Promise<GenerationResponse> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate 10 Instagram Story card designs based on: "${userPrompt}". 
    
    CONTENT & LANGUAGE RULES:
    - Language: CASUAL INDONESIAN (relatable, witty, or deep).
    - Structure: 1 Hook, 8 Content cards, 1 Closing.
    
    DESIGN & ATMOSPHERE RULES (CRITICAL):
    1. **Dynamic Backgrounds based on Vibe**:
       - IF HAPPY/LIGHT/FUN/MORNING: Use **SOFT PASTEL** gradients (e.g., 'from-rose-100 to-teal-50', 'from-blue-100 via-white to-purple-100'). 
         - **IMPORTANT**: Set 'textColor' to dark colors (e.g., '#1e293b') for readability on soft backgrounds.
       - IF SAD/DEEP/NIGHT/HEAVY: Use **DARK RICH** gradients (e.g., 'from-slate-900 to-black', 'from-indigo-950 to-purple-900').
         - **IMPORTANT**: Set 'textColor' to light colors (e.g., '#f8fafc') for readability on dark backgrounds.
    
    2. **Typography**:
       - Font: ALWAYS use 'Plus Jakarta Sans'.
       - Weight Variation: The text should feel dynamic. I will use **bold** marks for important words.
    
    3. **Decorations**:
       - Emojis: 2-3 relevant emojis per card.
       - Accent Color: Matching blob color.

    Return JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          cards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING, description: "Use **double asterisks** around keywords to make them Bold/Thick, while keeping the rest Light/Thin." },
                vibe: { type: Type.STRING },
                bgGradient: { 
                  type: Type.STRING,
                  description: "Tailwind gradient class. Soft pastels for happy vibes, Dark deeps for heavy vibes."
                },
                iconName: { type: Type.STRING },
                fontFamily: { 
                  type: Type.STRING, 
                  enum: ['Plus Jakarta Sans', 'Outfit', 'Inter', 'Playfair Display']
                },
                fontWeight: { type: Type.STRING, enum: ['normal', 'medium', 'semibold'] },
                alignment: { type: Type.STRING, enum: ['left', 'center', 'right'] },
                textColor: { type: Type.STRING, description: "Hex code. Dark (#1e293b) for light bg, Light (#f8fafc) for dark bg." },
                highlightColor: { type: Type.STRING },
                emojis: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "2-3 emojis related to the card text."
                },
                accentColor: { 
                  type: Type.STRING, 
                  description: "Hex or rgba color for decorative background blobs." 
                }
              },
              required: ["id", "text", "bgGradient", "iconName", "fontFamily", "fontWeight", "alignment", "textColor", "highlightColor", "emojis", "accentColor"]
            }
          }
        },
        required: ["cards"]
      }
    }
  });

  const parsedResponse = JSON.parse(response.text) as GenerationResponse;
  
  parsedResponse.cards = parsedResponse.cards.map(card => ({
    ...card,
    id: String(card.id)
  }));

  return parsedResponse;
};