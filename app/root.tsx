import { isRouteErrorResponse, Links, Meta, Outlet, Scripts } from "react-router";
import type { Route } from "./+types/root";
import interLatin from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
import monoLatin from "@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2?url";
import "./styles/global.css";

// Preload the two latin faces used above the fold (self-hosted; see styles/fonts.css).
export const links: Route.LinksFunction = () => [
  { rel: "preload", href: monoLatin, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
  { rel: "preload", href: interLatin, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        {/* resizes-content: the layout viewport shrinks with the mobile keyboard (the shell is 100dvh). */}
        <meta name="viewport" content="width=device-width, initial-scale=1, interactive-widget=resizes-content" />
        {/* Phase 1: placeholder content — keep out of search indexes (also sent as X-Robots-Tag). */}
        <meta name="robots" content="noindex, nofollow" />
        <Meta />
        <Links />
      </head>
      <body>
        {/* No <ScrollRestoration />: the shell pins the window and ContentPanel owns scroll handling. */}
        {children}
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Error";
  let details = "An unexpected error occurred.";
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404 — Not found" : `${error.status} — Error`;
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
  }
  return (
    <main>
      <section>
        <h1>{message}</h1>
        <p>{details}</p>
        <a href="/">Go to index.html</a>
      </section>
    </main>
  );
}
