"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

export default function GoogleAnalytics({ id }: { id: string }) {
  const pathname = usePathname();
  // The initial page view is sent by the gtag("config") call in the layout, so skip the first run here
  // to avoid counting it twice when gtag happens to be ready during hydration.
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", {
      page_path: pathname,
      send_to: id,
    });
  }, [pathname, id]);

  return null;
}
