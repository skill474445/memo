
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  refineDescription: async (input: string): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Given a brief product or service name "${input}", rewrite it as a professional, concise invoice line item description. Return only the description text.`,
        config: {
            temperature: 0.7,
            maxOutputTokens: 50
        }
      });
      return response.text.trim();
    } catch (error) {
      console.error("Gemini Error:", error);
      return input;
    }
  }
};
