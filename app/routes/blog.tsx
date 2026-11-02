import type { Route } from "./+types/blog";
import { requireEntry } from "~/content/load-entry";
import { entryMeta } from "~/content/meta";
import { BlogPage } from "~/components/pages/BlogPage";

export function loader({ url }: Route.LoaderArgs) {
  return { entry: requireEntry(url) };
}

export const meta: Route.MetaFunction = ({ loaderData }) => entryMeta(loaderData?.entry);

export default function Blog({ loaderData }: Route.ComponentProps) {
  return <BlogPage title={loaderData.entry.title} />;
}
