import type { Route } from "./+types/stack";
import { requireEntry } from "~/content/load-entry";
import { entryMeta } from "~/content/meta";
import { stack } from "~/data/stack";

export function loader({ url }: Route.LoaderArgs) {
  return { entry: requireEntry(url) };
}

export const meta: Route.MetaFunction = ({ loaderData }) => entryMeta(loaderData?.entry);

export default function Stack({ loaderData }: Route.ComponentProps) {
  return (
    <article>
      <h1>{loaderData.entry.title}</h1>
      <pre>{JSON.stringify(stack, null, 2)}</pre>
    </article>
  );
}
