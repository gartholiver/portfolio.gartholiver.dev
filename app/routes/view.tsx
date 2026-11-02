import type { Route } from "./+types/view";
import { requireEntry } from "~/content/load-entry";
import { entryMeta } from "~/content/meta";

export function loader({ url }: Route.LoaderArgs) {
  return { entry: requireEntry(url) };
}

export const meta: Route.MetaFunction = ({ loaderData }) => entryMeta(loaderData?.entry);

export default function View({ loaderData }: Route.ComponentProps) {
  const { entry } = loaderData;
  return (
    <article data-entry-id={entry.id} data-kind={entry.kind}>
      <h1>{entry.title}</h1>
      <p>Sample data — illustrative only.</p>
      {entry.content.type === "demo" ? (
        <p>Interactive demo “{entry.content.demoId}” is coming soon.</p>
      ) : (
        <p>Placeholder view. Details will be added after the project is reviewed.</p>
      )}
    </article>
  );
}
