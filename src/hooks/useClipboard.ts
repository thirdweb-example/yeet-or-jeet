"use client";

import { useCallback, useEffect, useState } from "react";

export function useClipboard(text: string, delay = 1500) {
  const [hasCopied, setHasCopied] = useState(false);

  const onCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setHasCopied(true);
  }, [text]);

  useEffect(() => {
    let timeoutId: number | null = null;

    if (hasCopied) {
      timeoutId = window.setTimeout(() => {
        setHasCopied(false);
      }, delay);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [hasCopied, delay]);

  return { onCopy, hasCopied };
}
