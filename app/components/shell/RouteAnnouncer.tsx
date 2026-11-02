import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import type { RegistryEntry } from "~/content/registry";

/** Polite live region announcing client-side page changes (SPA navigation is otherwise silent). */
export function RouteAnnouncer({ activeEntry }: { activeEntry: RegistryEntry | undefined }) {
  const { pathname } = useLocation();
  const [message, setMessage] = useState("");
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setMessage(activeEntry ? `${activeEntry.title}, ${activeEntry.label}` : "Page not found");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- announce on path changes only
  }, [pathname]);

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}
