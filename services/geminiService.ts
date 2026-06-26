import { GenerationResponse } from "../types";

export const generateStoryContent = async (userPrompt: string): Promise<GenerationResponse> => {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt: userPrompt })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Gagal membuat konten. Coba lagi.");
  }

  return response.json();
};
