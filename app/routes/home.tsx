import type { Route } from "./+types/home";
import { requireEntry } from "~/content/load-entry";
import { entryMeta } from "~/content/meta";
import { HomePage } from "~/components/pages/HomePage";

export function loader({ url }: Route.LoaderArgs) {
  return { entry: requireEntry(url) };
}

export const meta: Route.MetaFunction = ({ loaderData }) => entryMeta(loaderData?.entry);

export default function Home() {
  return <HomePage />;
}
