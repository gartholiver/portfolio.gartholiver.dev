import type { Route } from "./+types/markdown-doc";
import { requireEntry } from "~/content/load-entry";
import { loadMarkdown } from "~/content/markdown.server";
import { entryMeta } from "~/content/meta";

// Runs at build time (prerender); Markdown is parsed to HTML so the static page contains the text.
export function loader({ url }: Route.LoaderArgs) {
  const entry = requireEntry(url);
  if (entry.content.type !== "markdown") throw new Error(`${entry.id} is not a Markdown entry`);
  return { entry, doc: loadMarkdown(entry.content.file) };
}

export const meta: Route.MetaFunction = ({ loaderData }) => entryMeta(loaderData?.entry);

export default function MarkdownDoc({ loaderData }: Route.ComponentProps) {
  const { entry, doc } = loaderData;
  return (
    <article data-entry-id={entry.id}>
      {doc.toc.length > 0 && (
        <nav aria-label="Table of contents">
          <ul>
            {doc.toc.map((item) => (
              <li key={item.id} data-depth={item.depth}>
                <a href={`#${item.id}`}>{item.text}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {/* Trusted, build-time HTML from local Markdown (raw HTML in Markdown is dropped). */}
      <div dangerouslySetInnerHTML={{ __html: doc.html }} />
    </article>
  );
}
