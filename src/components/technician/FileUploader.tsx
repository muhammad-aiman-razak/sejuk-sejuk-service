"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Camera, X, FileText, Film } from "lucide-react";

interface FileUploaderProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
  error?: string;
  label?: string;
}

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "video/mp4",
  "video/quicktime",
  "application/pdf",
];

export function FileUploader({
  files,
  onChange,
  maxFiles = 6,
  maxSizeMB = 10,
  accept = "image/*,video/*,.pdf",
  error,
  label = "Upload Photos / Videos / PDF",
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    const totalCount = files.length + selected.length;
    if (totalCount > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of selected) {
      if (file.size > maxSizeBytes) {
        toast.error(`${file.name} exceeds ${maxSizeMB}MB limit`);
        continue;
      }

      if (!ACCEPTED_TYPES.some((t) => file.type.startsWith(t.split("/")[0]) || file.type === t)) {
        toast.error(`${file.name} is not a supported file type`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onChange([...files, ...validFiles]);
    }

    // Reset input so the same file can be re-selected
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleRemove(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  function getPreviewIcon(file: File) {
    if (file.type.startsWith("video/")) {
      return <Film className="h-8 w-8 text-gray-400" />;
    }
    if (file.type === "application/pdf") {
      return <FileText className="h-8 w-8 text-gray-400" />;
    }
    return null;
  }

  return (
    <div className="space-y-2">
      {label && (
        <p className="block text-sm font-medium text-gray-700">{label}</p>
      )}

      {/* Upload area */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-sm transition-colors",
          files.length >= maxFiles
            ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
            : "border-gray-300 bg-white text-gray-500 hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100",
          error && "border-red-400"
        )}
        disabled={files.length >= maxFiles}
      >
        <Camera className="h-8 w-8" />
        <span>
          {files.length >= maxFiles
            ? "Maximum files reached"
            : "Tap to add photos, videos, or PDFs"}
        </span>
        <span className="text-xs text-gray-400">
          {files.length}/{maxFiles} files
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleSelect}
        className="hidden"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Preview grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="relative overflow-hidden rounded-lg border bg-gray-50"
            >
              {file.type.startsWith("image/") ? (
                /* eslint-disable-next-line @next/next/no-img-element -- blob preview, not optimizable */
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-24 w-full object-cover"
                />
              ) : (
                <div className="flex h-24 flex-col items-center justify-center gap-1">
                  {getPreviewIcon(file)}
                  <span className="max-w-full truncate px-2 text-xs text-gray-500">
                    {file.name}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
