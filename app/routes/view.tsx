import type { Route } from "./+types/view";
import { requireEntry } from "~/content/load-entry";
import { entryMeta } from "~/content/meta";
import { getProject } from "~/content/registry";
import { getViewPlaceholder, viewPlaceholderCommon } from "~/content/view-placeholders";
import { DemoFrame } from "~/components/demo-frame/DemoFrame";
import { PlaceholderPanel } from "~/components/demo-frame/PlaceholderPanel";
import { getDemo } from "~/demos";
import styles from "./view.module.css";

export function loader({ url }: Route.LoaderArgs) {
  const entry = requireEntry(url);
  // Fail the build (not the visitor) when a registry entry has no demo / placeholder copy.
  if (entry.content.type === "demo" && !getDemo(entry.content.demoId)) {
    throw new Error(`${entry.id}: no demo registered for "${entry.content.demoId}" in app/demos/index.ts`);
  }
  if (entry.content.type === "view-placeholder" && !getViewPlaceholder(entry.id)) {
    throw new Error(`${entry.id}: no placeholder copy in app/content/view-placeholders.ts`);
  }
  return { entry };
}

export const meta: Route.MetaFunction = ({ loaderData }) => entryMeta(loaderData?.entry);

export default function View({ loaderData }: Route.ComponentProps) {
  const { entry } = loaderData;
  const project = entry.projectId ? getProject(entry.projectId) : undefined;
  const readmeUrl = project ? `/portfolio/${project.id}` : null;
  const demo = entry.content.type === "demo" ? getDemo(entry.content.demoId) : undefined;
  const placeholder = getViewPlaceholder(entry.id);

  return (
    <article className={styles.page} data-entry-id={entry.id} data-kind={entry.kind}>
      {demo ? (
        <DemoFrame title={entry.title} meta={demo.meta ?? project?.title} description={demo.description}>
          <demo.component />
        </DemoFrame>
      ) : (
        <DemoFrame title={entry.title} meta={project?.title} description={viewPlaceholderCommon.frameDescription}>
          {placeholder && <PlaceholderPanel placeholder={placeholder} readmeUrl={readmeUrl} />}
        </DemoFrame>
      )}
    </article>
  );
}
