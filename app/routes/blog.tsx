import type { Route } from "./+types/blog";
import { requireEntry } from "~/content/load-entry";
import { entryMeta } from "~/content/meta";

export function loader({ url }: Route.LoaderArgs) {
  return { entry: requireEntry(url) };
}

export const meta: Route.MetaFunction = ({ loaderData }) => entryMeta(loaderData?.entry);

export default function Blog({ loaderData }: Route.ComponentProps) {
  return (
    <article>
      <h1>{loaderData.entry.title}</h1>
      <p>Coming in phase 2.</p>
    </article>
  );
}
