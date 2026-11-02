import type { Route } from "./+types/about";
import { requireEntry } from "~/content/load-entry";
import { entryMeta } from "~/content/meta";
import { AboutPage } from "~/components/pages/AboutPage";

export function loader({ url }: Route.LoaderArgs) {
  return { entry: requireEntry(url) };
}

export const meta: Route.MetaFunction = ({ loaderData }) => entryMeta(loaderData?.entry);

export default function About({ loaderData }: Route.ComponentProps) {
  return <AboutPage title={loaderData.entry.title} />;
}
