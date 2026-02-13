import { StoryCard, HistorySession } from '../types';

export const syncToGoogleSheet = async (scriptUrl: string, prompt: string, cards: StoryCard[]) => {
  if (!scriptUrl) return;

  try {
    const payload = {
      prompt: prompt,
      cards: cards.map(c => ({
        id: c.id,
        text: c.text,
        vibe: c.vibe,
        bgGradient: c.bgGradient,
        textColor: c.textColor
      }))
    };

    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log("Data sent to Google Sheet successfully");
    return true;
  } catch (error) {
    console.error("Failed to sync to Google Sheet:", error);
    return false;
  }
};

export const fetchHistoryFromGoogleSheet = async (scriptUrl: string): Promise<HistorySession[]> => {
  if (!scriptUrl) return [];

  try {
    const response = await fetch(scriptUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) return [];

    const sessionsMap = new Map<string, HistorySession>();
    const sessionStyles = new Map<string, { bg: string, font: any, accent: string, emojis: string[] }>();

    const getRandomStyle = () => {
       const gradients = [
         'bg-gradient-to-br from-slate-900 to-black',
         'bg-gradient-to-br from-zinc-900 to-stone-950',
         'bg-gradient-to-tr from-slate-900 to-indigo-950',
         'bg-gradient-to-bl from-green-950 to-emerald-950',
         'bg-gradient-to-b from-rose-950 to-pink-950', 
       ];
       const accents = ['#6366f1', '#10b981', '#f43f5e', '#a855f7', '#0ea5e9'];
       const emojis = [['✨', '☁️'], ['🔥', '⚡'], ['🖤', '🌙'], ['🌿', '🍃'], ['☕', '🕰️']];
       const fonts = ['Outfit', 'Inter', 'Playfair Display', 'Space Grotesk', 'Cormorant Garamond'] as const;

       const styleIdx = Math.floor(Math.random() * gradients.length);
       return {
         bg: gradients[styleIdx],
         font: fonts[Math.floor(Math.random() * fonts.length)],
         accent: accents[styleIdx],
         emojis: emojis[styleIdx]
       };
    };

    data.forEach((row: any) => {
      const timestampStr = row.Timestamp || row.timestamp;
      const prompt = row.Prompt || row.prompt;
      const sessionKey = `${timestampStr}_${prompt}`;

      if (!sessionStyles.has(sessionKey)) {
        sessionStyles.set(sessionKey, getRandomStyle());
      }
      const style = sessionStyles.get(sessionKey)!;

      if (!sessionsMap.has(sessionKey)) {
        sessionsMap.set(sessionKey, {
          id: sessionKey,
          timestamp: new Date(timestampStr).getTime() || Date.now(),
          prompt: prompt,
          cards: []
        });
      }

      const session = sessionsMap.get(sessionKey);
      if (session) {
        session.cards.push({
          id: String(row['Card ID'] || row.cardId || Math.random().toString()),
          text: row.Text || row.text || "",
          vibe: row.Vibe || row.vibe || "vibes",
          bgGradient: style.bg,
          fontFamily: style.font,
          iconName: 'Sparkles',
          fontWeight: 'medium',
          alignment: 'center',
          textColor: '#ffffff',
          highlightColor: 'rgba(255,255,255,0.15)',
          accentColor: style.accent,
          emojis: style.emojis
        });
      }
    });

    return Array.from(sessionsMap.values()).sort((a, b) => b.timestamp - a.timestamp);

  } catch (error) {
    console.error("Failed to fetch from Google Sheet:", error);
    return [];
  }
};