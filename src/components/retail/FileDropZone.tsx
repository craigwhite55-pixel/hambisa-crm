"use client";

import { useRef } from "react";
import { formatFileSize } from "@/lib/retail/readUpload";

const ACCEPT =
  ".csv,.txt,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type FileDropZoneProps = {
  id: string;
  file: File | null;
  onFile: (file: File | null) => void;
  hint: string;
};

export function FileDropZone({ id, file, onFile, hint }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function pick() {
    inputRef.current?.click();
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0] ?? null;
    onFile(chosen);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0] ?? null;
    if (dropped) onFile(dropped);
  }

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={onInputChange}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={pick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pick();
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="file-drop-zone mb-3 cursor-pointer rounded-lg border-2 border-dashed border-border bg-surface2 px-4 py-6 text-center transition-colors hover:border-accent hover:bg-surface3"
      >
        {file ? (
          <>
            <p className="text-sm font-medium text-accent">{file.name}</p>
            <p className="mt-1 text-xs text-muted">{formatFileSize(file.size)} · click to change</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">Click to browse or drag a file here</p>
            <p className="mt-1 text-xs text-muted">{hint}</p>
          </>
        )}
      </div>
      <button type="button" className="btn-secondary text-xs" onClick={pick}>
        Browse files…
      </button>
    </div>
  );
}
