import { queryGemini } from "./providers/gemini";
import { queryGroq } from "./providers/groq";
import { getTodayMyt, getCurrentTimeMyt } from "@/lib/utils";

function buildSystemInstruction(): string {
  const today = getTodayMyt();
  const currentTime = getCurrentTimeMyt();

  return `You are the AI assistant for Sejuk Sejuk Service Portal, an aircond service management system in Malaysia.

Your role is to answer operational questions about service orders, technician performance, and business metrics.

Available technicians: Ali, John, Bala, Yusoff.
Order statuses follow this workflow: new → assigned → in_progress → job_done → reviewed → closed.
"Completed" means the technician finished the work — status is job_done, reviewed, or closed.
Currency is Malaysian Ringgit (RM).
Timezone: Malaysia Time (MYT, UTC+8).
Today's date is ${today} and the current time is ${currentTime} MYT.

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
- NEVER expose internal technical details like function names, database column names, or status codes
- Use human-readable status names: New, Assigned, In Progress, Job Done, Reviewed, Closed
- NEVER include raw function call syntax in your responses

If the question is not about service operations data, politely explain that you can only answer questions about service orders, technicians, and business metrics.`;
}

const FALLBACK_MESSAGE =
  "I couldn't process your question right now. Please try again in a moment.";

/**
 * Queries AI with automatic provider fallback.
 * Tries Gemini first, falls back to Groq if Gemini fails.
 */
export async function queryAi(
  question: string
): Promise<{ answer: string }> {
  const systemInstruction = buildSystemInstruction();

  // Try Gemini (primary)
  console.log("[AI] Trying Gemini...");
  const geminiResult = await queryGemini(question, systemInstruction);
  if (geminiResult) {
    console.log("[AI] Gemini responded successfully");
    return geminiResult;
  }

  // Fallback to Groq
  console.log("[AI] Gemini failed, falling back to Groq...");
  const groqResult = await queryGroq(question, systemInstruction);
  if (groqResult) {
    console.log("[AI] Groq responded successfully (fallback)");
    return groqResult;
  }

  // Both failed
  console.error("[AI] Both providers failed");
  return { answer: FALLBACK_MESSAGE };
}
