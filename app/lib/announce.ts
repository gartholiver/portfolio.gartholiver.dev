import { useCallback, useState } from "react";

/** Zero-width space: invisible, but it changes the text node so a live region treats it as new. */
const ZERO_WIDTH_SPACE = "​";

/**
 * Screen readers may skip a live-region update whose text is identical to the previous one (pressing
 * "Reset demo" twice, hitting the same validation error again). Appending an invisible marker on
 * every other announcement makes consecutive identical messages differ without changing what is
 * spoken or shown. `seq` must increase with every announcement; `0` (nothing announced yet) is left bare.
 */
export function withRepeatMarker(message: string, seq: number): string {
  return seq % 2 === 1 ? `${message}${ZERO_WIDTH_SPACE}` : message;
}

/**
 * State for a polite live region: render `text` inside it and call `announce(message)` to update it.
 * Every call counts as a new announcement, even when `message` equals the previous one.
 */
export function useRepeatableAnnouncement(): readonly [text: string, announce: (message: string) => void] {
  const [state, setState] = useState({ message: "", seq: 0 });
  const announce = useCallback((message: string) => {
    setState((previous) => ({ message, seq: previous.seq + 1 }));
  }, []);
  return [withRepeatMarker(state.message, state.seq), announce] as const;
}
