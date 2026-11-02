import type { MouseEvent } from "react";
import { useNavigate } from "react-router";
import { getEntryByPathname } from "~/content/registry";
import { getInternalNavigation } from "~/lib/internal-links";

const isAppPath = (pathname: string) => !!getEntryByPathname(pathname);

/**
 * Renders trusted, build-time Markdown HTML. Clicks on internal links to app routes become
 * client-side navigations (so the persistent shell stays mounted); `#hash`, external, modified
 * and unknown-path links keep native behaviour. One delegated handler — the HTML is a string, so
 * its anchors can't take React props.
 */
export function MarkdownContent({ html, className }: { html: string; className?: string }) {
  const navigate = useNavigate();

  function onClick(e: MouseEvent<HTMLDivElement>) {
    if (!(e.target instanceof Element)) return;
    const anchor = e.target.closest("a");
    if (!anchor || !e.currentTarget.contains(anchor)) return;
    const to = getInternalNavigation(
      {
        href: anchor.getAttribute("href"),
        target: anchor.getAttribute("target"),
        download: anchor.hasAttribute("download"),
        button: e.button,
        metaKey: e.metaKey,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        defaultPrevented: e.defaultPrevented,
      },
      window.location.href,
      isAppPath,
    );
    if (to) {
      e.preventDefault();
      void navigate(to);
    }
  }

  return (
    <div
      // `md-content` scopes the global document defaults (tables) in app/styles/global.css.
      className={className ? `md-content ${className}` : "md-content"}
      onClick={onClick}
      // Trusted: rendered at build time from local Markdown; raw HTML in Markdown is dropped.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
