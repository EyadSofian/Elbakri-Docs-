import { useEffect } from "react";

/**
 * Sets document.title for the current page. Replaces TanStack Start's
 * per-route `head()` meta in the plain SPA. Safe and loop-free: only writes
 * when the title string actually changes.
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);
}
