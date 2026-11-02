/**
 * Decide whether a click on a link inside rendered Markdown should become a client-side
 * navigation. Pure (no DOM, no router) so it is unit-testable; the component supplies the facts.
 *
 * Returns the `pathname + search + hash` to pass to `navigate()`, or `null` to let the browser
 * handle the click (external links, `#hash` links, modified clicks, downloads, new tabs, unknown
 * paths such as static files).
 */
export interface LinkClick {
  /** The anchor's raw `href` attribute. */
  href: string | null;
  target?: string | null;
  download?: boolean;
  button: number;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  defaultPrevented?: boolean;
}

export function getInternalNavigation(
  click: LinkClick,
  /** The current document URL, e.g. `window.location.href`. */
  currentUrl: string,
  /** Whether a pathname is an app route. Unknown same-origin paths fall through to the browser. */
  isAppPath: (pathname: string) => boolean,
): string | null {
  if (click.defaultPrevented || click.button !== 0) return null;
  if (click.metaKey || click.ctrlKey || click.shiftKey || click.altKey) return null;
  if (click.download) return null;
  if (click.target && click.target !== "_self") return null;
  const href = click.href?.trim();
  if (!href || href.startsWith("#")) return null;

  let current: URL;
  let next: URL;
  try {
    current = new URL(currentUrl);
    next = new URL(href, current);
  } catch {
    return null;
  }
  if (next.origin !== current.origin) return null;
  // Same document, different fragment: native anchor behaviour (the shell scrolls the panel).
  if (next.pathname === current.pathname && next.search === current.search && next.hash) return null;
  if (!isAppPath(next.pathname)) return null;
  return `${next.pathname}${next.search}${next.hash}`;
}
