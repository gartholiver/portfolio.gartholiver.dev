import type { Route } from "./+types/search";
import { requireEntry } from "~/content/load-entry";
import { entryMeta } from "~/content/meta";
import { buildSearchIndex } from "~/content/search-index.server";
import { SearchPage } from "~/components/pages/SearchPage";

// The index is built at prerender time and shipped as loader data. The query lives in `?q=` and is
// read client-side after hydration by <SearchPage> (the prerendered markup is always query-free).
export function loader({ url }: Route.LoaderArgs) {
  return { entry: requireEntry(url), index: buildSearchIndex() };
}

// Typing updates `?q=` via replace navigations; the index never changes, so never refetch it.
export function shouldRevalidate() {
  return false;
}

export const meta: Route.MetaFunction = ({ loaderData }) => entryMeta(loaderData?.entry);

export default function Search({ loaderData }: Route.ComponentProps) {
  return <SearchPage title={loaderData.entry.title} index={loaderData.index} />;
}
