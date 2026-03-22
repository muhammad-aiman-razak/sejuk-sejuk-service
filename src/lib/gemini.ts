import { GoogleGenAI } from "@google/genai";

/**
 * Creates a Gemini AI client. Server-side only — used in API routes.
 */
export function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenAI({ apiKey });
}
