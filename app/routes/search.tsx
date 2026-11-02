import type { Route } from "./+types/search";
import { requireEntry } from "~/content/load-entry";
import { entryMeta } from "~/content/meta";
import { buildSearchIndex } from "~/content/search-index.server";

// The index is built at prerender time and shipped as loader data. Query lives in `?q=`
// (read client-side by the search UI in a later task — keep the prerendered markup query-free).
export function loader({ url }: Route.LoaderArgs) {
  return { entry: requireEntry(url), index: buildSearchIndex() };
}

export const meta: Route.MetaFunction = ({ loaderData }) => entryMeta(loaderData?.entry);

export default function Search({ loaderData }: Route.ComponentProps) {
  return (
    <article>
      <h1>{loaderData.entry.title}</h1>
      <p>{loaderData.index.length} pages indexed. Search UI coming soon.</p>
    </article>
  );
}
