import { Link } from "react-router";
import type { Route } from "./+types/not-found";
import { pageTitle } from "~/content/meta";

/**
 * Catch-all. No loader (ssr:false forbids loaders on non-prerendered paths). Prerendered at /404
 * and copied to build/client/404.html, which Netlify serves with a 404 status for unknown URLs.
 * Client-side navigation to an unknown path also lands here.
 */
export const meta: Route.MetaFunction = () => [{ title: pageTitle("404 — Not found") }];

export default function NotFound() {
  return (
    <article>
      <h1>404 — File not found</h1>
      <p>This file doesn’t exist in the workspace.</p>
      <Link to="/">Open index.html</Link>
    </article>
  );
}
