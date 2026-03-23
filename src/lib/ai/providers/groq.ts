import Groq from "groq-sdk";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "groq-sdk/resources/chat/completions";
import { executeFunction } from "@/lib/ai/executor";

const GROQ_MODEL = "llama-3.1-8b-instant";

/** Tool declarations in OpenAI/Groq format. */
const GROQ_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "getJobsByTechnician",
      description:
        "Get a list of jobs/orders for a specific technician, optionally filtered by status and date range.",
      parameters: {
        type: "object",
        properties: {
          technicianName: {
            type: "string",
            description: "The technician's name (e.g., 'Ali', 'John', 'Bala', 'Yusoff')",
          },
          status: {
            type: "string",
            description:
              "Filter by status. Use 'completed' for job_done/reviewed/closed, or a specific status",
          },
          dateFrom: { type: "string", description: "Start date (YYYY-MM-DD)" },
          dateTo: { type: "string", description: "End date (YYYY-MM-DD)" },
        },
        required: ["technicianName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getJobCount",
      description:
        "Count the number of jobs/orders matching the given filters. Use for 'how many' questions.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status" },
          technicianName: { type: "string", description: "Filter by technician name" },
          dateFrom: { type: "string", description: "Start date (YYYY-MM-DD)" },
          dateTo: { type: "string", description: "End date (YYYY-MM-DD)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getTechnicianPerformance",
      description:
        "Get performance metrics for all technicians for a given week. Use for ranking or 'who completed the most' questions.",
      parameters: {
        type: "object",
        properties: {
          weekStart: {
            type: "string",
            description: "The Monday of the target week (YYYY-MM-DD). Defaults to current week.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getDailySummary",
      description: "Get a daily summary of orders with counts per day.",
      parameters: {
        type: "object",
        properties: {
          dateFrom: { type: "string", description: "Start date (YYYY-MM-DD)" },
          dateTo: { type: "string", description: "End date (YYYY-MM-DD)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getOrderDetails",
      description: "Get full details for a specific order by order number or ID.",
      parameters: {
        type: "object",
        properties: {
          orderNo: { type: "string", description: "The order number (e.g., 'ORD-20260304-0001')" },
          orderId: { type: "string", description: "The order UUID" },
        },
      },
    },
  },
];

function createGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }
  return new Groq({ apiKey });
}

/**
 * Queries Groq with function calling (OpenAI-compatible format).
 * Returns the formatted answer, or null if the request fails (for fallback).
 */
export async function queryGroq(
  question: string,
  systemInstruction: string
): Promise<{ answer: string } | null> {
  try {
    const client = createGroqClient();

    // Step 1: Send question with tools
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemInstruction },
      { role: "user", content: question },
    ];

    const response = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      tools: GROQ_TOOLS,
      tool_choice: "auto",
      temperature: 0.1,
    });

    const choice = response.choices[0];
    if (!choice) return null;

    // Step 2: Check for tool calls
    const toolCalls = choice.message.tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      // Direct response (no function call needed)
      return choice.message.content
        ? { answer: choice.message.content }
        : null;
    }

    // Step 3: Execute each tool call
    const toolMessages: ChatCompletionMessageParam[] = [];
    for (const tc of toolCalls) {
      const args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
      console.log(`[Groq] Function call: ${tc.function.name}(${JSON.stringify(args)})`);
      const result = await executeFunction(tc.function.name, args);
      console.log(`[Groq] Result: ${result.summary}`);

      toolMessages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify(result.data),
      });
    }

    // Step 4: Send results back for formatting
    const assistantMessage: ChatCompletionMessageParam = {
      role: "assistant",
      tool_calls: toolCalls.map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: { name: tc.function.name, arguments: tc.function.arguments },
      })),
    };

    const finalResponse = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        ...messages,
        assistantMessage,
        ...toolMessages,
      ],
      tools: GROQ_TOOLS,
      temperature: 0.2,
    });

    const answer = finalResponse.choices[0]?.message?.content;
    return answer ? { answer } : null;
  } catch (error) {
    console.error("[Groq] Failed:", error instanceof Error ? error.message : error);
    return null;
  }
}
