import { useEffect } from "react";

export function useKeyboard(bindings: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = `${e.ctrlKey ? "Ctrl+" : ""}${e.shiftKey ? "Shift+" : ""}${e.key}`;

      if (bindings[key]) {
        e.preventDefault();
        bindings[key]();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [bindings]);
}
