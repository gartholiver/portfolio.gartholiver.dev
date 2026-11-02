import type { Route } from "./+types/markdown-doc";
import { requireEntry } from "~/content/load-entry";
import { loadMarkdown } from "~/content/markdown.server";
import { entryMeta } from "~/content/meta";
import { MarkdownDocView } from "~/components/markdown-doc/MarkdownDocView";

// Runs at build time (prerender); Markdown is parsed to HTML so the static page contains the text.
export function loader({ url }: Route.LoaderArgs) {
  const entry = requireEntry(url);
  if (entry.content.type !== "markdown") throw new Error(`${entry.id} is not a Markdown entry`);
  const { frontmatter, html, toc } = loadMarkdown(entry.content.file); // plain `text` is search-only
  return { entry, doc: { frontmatter, html, toc } };
}

export const meta: Route.MetaFunction = ({ loaderData }) => entryMeta(loaderData?.entry);

export default function MarkdownDoc({ loaderData }: Route.ComponentProps) {
  const { entry, doc } = loaderData;
  return <MarkdownDocView entry={entry} doc={doc} />;
}
