import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface AiMessageProps {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

export function AiMessage({ role, content, isLoading }: AiMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-900"
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-1 py-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
          </div>
        ) : (
          <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
        )}
      </div>
    </div>
  );
}
