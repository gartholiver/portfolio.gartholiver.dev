import type { Route } from "./+types/about";
import { requireEntry } from "~/content/load-entry";
import { entryMeta } from "~/content/meta";
import { profile } from "~/data/profile";

export function loader({ url }: Route.LoaderArgs) {
  return { entry: requireEntry(url) };
}

export const meta: Route.MetaFunction = ({ loaderData }) => entryMeta(loaderData?.entry);

export default function About({ loaderData }: Route.ComponentProps) {
  return (
    <article>
      <h1>{loaderData.entry.title}</h1>
      <p>{profile.headline}</p>
      <h2>Biography</h2>
      {profile.biography.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <h2>Experience</h2>
      <ul>
        {profile.experience.map((x) => (
          <li key={x.period + x.role}>
            {x.period} — {x.role}: {x.summary}
          </li>
        ))}
      </ul>
    </article>
  );
}
