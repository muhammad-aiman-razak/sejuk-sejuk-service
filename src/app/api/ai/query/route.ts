import { NextRequest, NextResponse } from "next/server";
import {
  createPartFromFunctionCall,
  createPartFromFunctionResponse,
  createUserContent,
  FunctionCallingConfigMode,
} from "@google/genai";
import { createGeminiClient } from "@/lib/gemini";
import { AI_FUNCTION_DECLARATIONS } from "@/lib/ai/tools";
import { executeFunction } from "@/lib/ai/executor";

function buildSystemInstruction(): string {
  const today = new Date().toISOString().split("T")[0];

  return `You are the AI assistant for Sejuk Sejuk Service Portal, an aircond service management system in Malaysia.

Your role is to answer operational questions about service orders, technician performance, and business metrics.

Available technicians: Ali, John, Bala, Yusoff.
Order statuses follow this workflow: new → assigned → in_progress → job_done → reviewed → closed.
"Completed" means the technician finished the work — status is job_done, reviewed, or closed.
Currency is Malaysian Ringgit (RM).
Today's date is ${today}.

When the user asks about "last week", calculate the Monday-to-Sunday range for the previous week.
When the user asks about "this week", use this Monday's date as the start.
When the user asks about "today", use ${today} for both dateFrom and dateTo.

Always use the available functions to retrieve data. Never make up data.

IMPORTANT: Do NOT use markdown formatting. No asterisks, no bold, no headers. Use plain text only.
Format your answers clearly using plain text:
- Use dashes (- ) for bullet points, not asterisks
- Include order numbers, customer names, and service types when listing jobs
- Include amounts (in RM) when relevant
- Summarize totals at the end when listing multiple items
- If no data is found, say so clearly

If the question is not about service operations data, politely explain that you can only answer questions about service orders, technicians, and business metrics.`;
}

interface AiQueryResponse {
  data: { answer: string };
}

interface AiQueryError {
  error: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<AiQueryResponse | AiQueryError>> {
  try {
    const body = await request.json();
    const { question } = body;

    if (
      !question ||
      typeof question !== "string" ||
      question.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    if (question.length > 500) {
      return NextResponse.json(
        { error: "Question is too long (max 500 characters)" },
        { status: 400 }
      );
    }

    const ai = createGeminiClient();
    const systemInstruction = buildSystemInstruction();

    // Step 1: Send question to Gemini with function declarations
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

    // Step 2: Check if Gemini wants to call function(s)
    const functionCalls = response.functionCalls;

    if (!functionCalls || functionCalls.length === 0) {
      // Gemini answered directly (out-of-scope or simple response)
      const directAnswer = response.text;
      if (directAnswer) {
        return NextResponse.json({ data: { answer: directAnswer } });
      }
      return NextResponse.json({
        data: {
          answer:
            "I couldn't understand that question. Try asking about technician jobs, order counts, or revenue.",
        },
      });
    }

    // Step 3: Execute each function call
    const functionResults = await Promise.all(
      functionCalls.map(async (fc) => {
        console.log(`AI function call: ${fc.name}(${JSON.stringify(fc.args)})`);
        const result = await executeFunction(fc.name!, fc.args ?? {});
        console.log(`AI function result: ${result.summary}`);
        return { name: fc.name!, data: result.data };
      })
    );

    // Step 4: Build conversation with function results and get formatted answer
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
    if (!answer) {
      return NextResponse.json({
        data: {
          answer:
            "I was unable to generate a response. Please try rephrasing your question.",
        },
      });
    }

    return NextResponse.json({ data: { answer } });
  } catch (error: unknown) {
    console.error("AI query error:", error);

    // Handle Gemini rate limiting
    const isRateLimit =
      error instanceof Error &&
      (error.message.includes("429") ||
        error.message.includes("RESOURCE_EXHAUSTED") ||
        error.message.includes("quota"));

    if (isRateLimit) {
      return NextResponse.json(
        {
          error:
            "AI rate limit reached. The free tier allows limited requests per day. Please try again later.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Something went wrong processing your question. Please try again.",
      },
      { status: 500 }
    );
  }
}
