import { Link } from "react-router";
import type { Route } from "./+types/home";
import { requireEntry } from "~/content/load-entry";
import { entryMeta } from "~/content/meta";
import { projects } from "~/content/registry";
import { home } from "~/data/home";

export function loader({ url }: Route.LoaderArgs) {
  return { entry: requireEntry(url) };
}

export const meta: Route.MetaFunction = ({ loaderData }) => entryMeta(loaderData?.entry);

export default function Home() {
  return (
    <article>
      <h1>{home.heading}</h1>
      <p>{home.intro}</p>
      <h2>Projects</h2>
      <ul>
        {projects.map((p) => (
          <li key={p.id}>
            <Link to={`/portfolio/${p.id}`}>{p.title}</Link>
          </li>
        ))}
      </ul>
      <p>{home.guidance}</p>
    </article>
  );
}
