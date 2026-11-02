import type { Route } from "./+types/stack";
import { requireEntry } from "~/content/load-entry";
import { entryMeta } from "~/content/meta";
import { StackPage } from "~/components/pages/StackPage";

export function loader({ url }: Route.LoaderArgs) {
  return { entry: requireEntry(url) };
}

export const meta: Route.MetaFunction = ({ loaderData }) => entryMeta(loaderData?.entry);

export default function Stack({ loaderData }: Route.ComponentProps) {
  return <StackPage title={loaderData.entry.title} />;
}
