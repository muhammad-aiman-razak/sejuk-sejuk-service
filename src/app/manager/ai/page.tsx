import { AiChatWindow } from "@/components/ai/AiChatWindow";

export default function AiAssistantPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          AI Assistant
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Ask questions about service operations, technician performance, and
          order data.
        </p>
      </div>
      <AiChatWindow />
    </div>
  );
}
