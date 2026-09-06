"use client";
import { useEffect, useState } from "react";
import type { Watch } from "@/shared/application/peques-app";

export function useLocalData<T>(watch: Watch<T>) {
  const [result, setResult] = useState<{ source: Watch<T>; data?: T; error?: unknown } | null>(
    null,
  );
  useEffect(
    () =>
      watch(
        (data) => setResult({ source: watch, data }),
        (error) => setResult({ source: watch, error }),
      ),
    [watch],
  );
  return result?.source === watch ? result : null;
}
