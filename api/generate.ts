import { GoogleGenAI, Type } from "@google/genai";

// Helper to clean and parse JSON securely from any model response
function cleanAndParseJson(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return JSON.parse(cleaned.trim());
}

// Clean and guarantee all required fields for safety in UI
function sanitizeCardsResponse(parsed: any): any {
  if (!parsed || !Array.isArray(parsed.cards)) {
    throw new Error("Invalid structure: 'cards' array is missing or empty.");
  }

  const cleanedCards = parsed.cards.map((card: any, idx: number) => {
    return {
      id: card.id ? String(card.id) : String(idx + 1),
      text: card.text || "...",
      vibe: card.vibe || "vibes",
      bgGradient: card.bgGradient || "from-slate-900 to-black",
      iconName: card.iconName || "Sparkles",
      fontFamily: card.fontFamily || "Plus Jakarta Sans",
      fontWeight: card.fontWeight || "medium",
      alignment: card.alignment || "center",
      textColor: card.textColor || "#ffffff",
      highlightColor: card.highlightColor || "rgba(255, 255, 255, 0.15)",
      emojis: Array.isArray(card.emojis) ? card.emojis : ["✨", "🌸"],
      accentColor: card.accentColor || "rgba(99, 102, 241, 0.2)"
    };
  });

  return { cards: cleanedCards };
}

// 1. GEMINI PROVIDER
const tryGemini = async (userPrompt: string, geminiKey: string) => {
  console.log("Attempting generation via Gemini...");
  const ai = new GoogleGenAI({
    apiKey: geminiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
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

  const rawText = response.text;
  if (!rawText) throw new Error("Empty text returned from Gemini API");
  return cleanAndParseJson(rawText);
};

// 2. GROQ PROVIDER
const tryGroq = async (userPrompt: string, groqKey: string) => {
  console.log("Attempting generation via Groq...");
  const payload = {
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are a creative Instagram Story and typography designer. You output beautiful JSON representations of typography card layouts.
        
        You must output valid JSON matching the following structure exactly:
        {
          "cards": [
            {
              "id": "1",
              "text": "Card text with some word decorated in **double asterisks** for emphasis.",
              "vibe": "cheerful",
              "bgGradient": "from-rose-100 to-teal-50",
              "iconName": "Sparkles",
              "fontFamily": "Plus Jakarta Sans",
              "fontWeight": "medium",
              "alignment": "center",
              "textColor": "#1e293b",
              "highlightColor": "rgba(0,0,0,0.1)",
              "emojis": ["✨", "🌸"],
              "accentColor": "rgba(244,63,94,0.2)"
            }
          ]
        }

        CONTENT & LANGUAGE RULES:
        - Language: CASUAL INDONESIAN (relatable, witty, or deep).
        - Structure: 1 Hook, 8 Content cards, 1 Closing (exactly 10 cards in total).

        DESIGN & ATMOSPHERE RULES (CRITICAL):
        1. **Dynamic Backgrounds based on Vibe**:
           - IF HAPPY/LIGHT/FUN/MORNING: Use **SOFT PASTEL** gradients (e.g., 'from-rose-100 to-teal-50', 'from-blue-100 via-white to-purple-100'). 
             - **IMPORTANT**: Set 'textColor' to dark colors (e.g., '#1e293b') for readability on soft backgrounds.
           - IF SAD/DEEP/NIGHT/HEAVY: Use **DARK RICH** gradients (e.g., 'from-slate-900 to-black', 'from-indigo-950 to-purple-900').
             - **IMPORTANT**: Set 'textColor' to light colors (e.g., '#f8fafc') for readability on dark backgrounds.

        2. **Typography**:
           - Font: ALWAYS use 'Plus Jakarta Sans'.
           - Weight Variation: The text should feel dynamic. I will use **bold** marks (double asterisks) around key words for emphasis.

        3. **Decorations**:
           - Emojis: 2-3 relevant emojis per card in the "emojis" array.
           - Accent Color: Matching blob color in hex or rgba format.
        `
      },
      {
        role: "user",
        content: `Generate 10 Instagram Story cards based on: "${userPrompt}". Output ONLY the raw JSON object, no markdown blocks, no prefix text, no explanations.`
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.7
  };

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty text response from Groq API");
  return cleanAndParseJson(text);
};

// 3. QWEN PROVIDER
const tryQwen = async (userPrompt: string, qwenKey: string) => {
  console.log("Attempting generation via Qwen...");
  const payload = {
    model: "qwen-plus",
    messages: [
      {
        role: "system",
        content: `You are a creative Instagram Story and typography designer. You output beautiful JSON representations of typography card layouts.
        
        You must output valid JSON matching the following structure exactly:
        {
          "cards": [
            {
              "id": "1",
              "text": "Card text with some word decorated in **double asterisks** for emphasis.",
              "vibe": "cheerful",
              "bgGradient": "from-rose-100 to-teal-50",
              "iconName": "Sparkles",
              "fontFamily": "Plus Jakarta Sans",
              "fontWeight": "medium",
              "alignment": "center",
              "textColor": "#1e293b",
              "highlightColor": "rgba(0,0,0,0.1)",
              "emojis": ["✨", "🌸"],
              "accentColor": "rgba(244,63,94,0.2)"
            }
          ]
        }

        CONTENT & LANGUAGE RULES:
        - Language: CASUAL INDONESIAN (relatable, witty, or deep).
        - Structure: 1 Hook, 8 Content cards, 1 Closing (exactly 10 cards in total).

        DESIGN & ATMOSPHERE RULES (CRITICAL):
        1. **Dynamic Backgrounds based on Vibe**:
           - IF HAPPY/LIGHT/FUN/MORNING: Use **SOFT PASTEL** gradients (e.g., 'from-rose-100 to-teal-50', 'from-blue-100 via-white to-purple-100'). 
             - **IMPORTANT**: Set 'textColor' to dark colors (e.g., '#1e293b') for readability on soft backgrounds.
           - IF SAD/DEEP/NIGHT/HEAVY: Use **DARK RICH** gradients (e.g., 'from-slate-900 to-black', 'from-indigo-950 to-purple-900').
             - **IMPORTANT**: Set 'textColor' to light colors (e.g., '#f8fafc') for readability on dark backgrounds.

        2. **Typography**:
           - Font: ALWAYS use 'Plus Jakarta Sans'.
           - Weight Variation: The text should feel dynamic. I will use **bold** marks (double asterisks) around key words for emphasis.

        3. **Decorations**:
           - Emojis: 2-3 relevant emojis per card in the "emojis" array.
           - Accent Color: Matching blob color in hex or rgba format.
        `
      },
      {
        role: "user",
        content: `Generate 10 Instagram Story cards based on: "${userPrompt}". Output ONLY the raw JSON object, no markdown blocks, no prefix text, no explanations.`
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.7
  };

  const res = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${qwenKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Qwen API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty text response from Qwen API");
  return cleanAndParseJson(text);
};

// Export Vercel-compatible & Express-compatible API handler
export default async function handler(req: any, res: any) {
  // CORS configuration if needed
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Prompt is required and must be a string." });
  }

  const errors: string[] = [];

  // 1. Try Gemini
  const geminiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (geminiKey) {
    try {
      const result = await tryGemini(prompt, geminiKey);
      const sanitized = sanitizeCardsResponse(result);
      console.log("Successfully generated using Gemini.");
      return res.status(200).json(sanitized);
    } catch (e: any) {
      console.error("Gemini failed:", e.message || e);
      errors.push(`Gemini: ${e.message || String(e)}`);
    }
  } else {
    console.log("Skipping Gemini (GEMINI_API_KEY is not defined)");
    errors.push("Gemini key is missing");
  }

  // 2. Try Groq (Fallback 1)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const result = await tryGroq(prompt, groqKey);
      const sanitized = sanitizeCardsResponse(result);
      console.log("Successfully generated using Groq fallback.");
      return res.status(200).json(sanitized);
    } catch (e: any) {
      console.error("Groq fallback failed:", e.message || e);
      errors.push(`Groq: ${e.message || String(e)}`);
    }
  } else {
    console.log("Skipping Groq (GROQ_API_KEY is not defined)");
    errors.push("Groq key is missing");
  }

  // 3. Try Qwen (Fallback 2)
  const qwenKey = process.env.QWEN_API_KEY;
  if (qwenKey) {
    try {
      const result = await tryQwen(prompt, qwenKey);
      const sanitized = sanitizeCardsResponse(result);
      console.log("Successfully generated using Qwen fallback.");
      return res.status(200).json(sanitized);
    } catch (e: any) {
      console.error("Qwen fallback failed:", e.message || e);
      errors.push(`Qwen: ${e.message || String(e)}`);
    }
  } else {
    console.log("Skipping Qwen (QWEN_API_KEY is not defined)");
    errors.push("Qwen key is missing");
  }

  // If all failed
  console.error("All AI providers failed or are unconfigured:", errors);
  return res.status(500).json({
    error: "Gagal membuat konten. Semua AI provider mengalami gangguan atau limit.",
    details: errors
  });
}
