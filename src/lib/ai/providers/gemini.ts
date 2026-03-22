import {
  createPartFromFunctionCall,
  createPartFromFunctionResponse,
  createUserContent,
  FunctionCallingConfigMode,
} from "@google/genai";
import { createGeminiClient } from "@/lib/gemini";
import { AI_FUNCTION_DECLARATIONS } from "@/lib/ai/tools";
import { executeFunction } from "@/lib/ai/executor";

/**
 * Queries Gemini with function calling.
 * Returns the formatted answer, or null if the request fails (for fallback).
 */
export async function queryGemini(
  question: string,
  systemInstruction: string
): Promise<{ answer: string } | null> {
  try {
    const ai = createGeminiClient();

    // Step 1: Send question with function declarations
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: question,
      config: {
        systemInstruction,
        temperature: 0.1,
        tools: [{ functionDeclarations: AI_FUNCTION_DECLARATIONS }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.AUTO,
          },
        },
      },
    });

    // Step 2: Check for function calls
    const functionCalls = response.functionCalls;

    if (!functionCalls || functionCalls.length === 0) {
      const directAnswer = response.text;
      return directAnswer ? { answer: directAnswer } : null;
    }

    // Step 3: Execute functions
    const functionResults = await Promise.all(
      functionCalls.map(async (fc) => {
        console.log(`[Gemini] Function call: ${fc.name}(${JSON.stringify(fc.args)})`);
        const result = await executeFunction(fc.name!, fc.args ?? {});
        console.log(`[Gemini] Result: ${result.summary}`);
        return { name: fc.name!, data: result.data };
      })
    );

    // Step 4: Send results back to Gemini for formatting
    const contents = [
      createUserContent(question),
      {
        role: "model" as const,
        parts: functionCalls.map((fc) =>
          createPartFromFunctionCall(fc.name!, fc.args ?? {})
        ),
      },
      {
        role: "user" as const,
        parts: functionResults.map((fr) =>
          createPartFromFunctionResponse(fr.name, fr.name, {
            result: fr.data,
          })
        ),
      },
    ];

    const finalResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.2,
        tools: [{ functionDeclarations: AI_FUNCTION_DECLARATIONS }],
      },
    });

    const answer = finalResponse.text;
    return answer ? { answer } : null;
  } catch (error) {
    console.error("[Gemini] Failed:", error instanceof Error ? error.message : error);
    return null;
  }
}
