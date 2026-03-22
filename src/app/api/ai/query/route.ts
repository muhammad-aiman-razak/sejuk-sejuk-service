import { NextRequest, NextResponse } from "next/server";
import { queryAi } from "@/lib/ai/query";

interface AiQueryResponse {
  data: { answer: string };
}

interface AiQueryError {
  error: string;
}

/**
 * POST /api/ai/query
 * Accepts a natural language question and returns an AI-generated answer
 * based on operational data. Uses Gemini as primary provider with Groq
 * as automatic fallback.
 */
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

    const result = await queryAi(question.trim());
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("AI query error:", error);
    return NextResponse.json(
      {
        error:
          "Something went wrong processing your question. Please try again.",
      },
      { status: 500 }
    );
  }
}
