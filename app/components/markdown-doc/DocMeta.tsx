import { Link } from "react-router";
import type { RouteEntry } from "~/content/registry";
import { getProject } from "~/content/registry";
import type { DocFrontmatter } from "~/lib/markdown/render";
import styles from "./MarkdownDocView.module.css";

const DOC_TYPE_LABEL: Record<string, string> = {
  readme: "case study",
  "technical-requirements": "technical requirements",
};

/** Obsidian-style "properties" block built from frontmatter + registry data. */
export function DocMeta({ entry, frontmatter }: { entry: RouteEntry; frontmatter: DocFrontmatter }) {
  const content = entry.content;
  const docType = content.type === "markdown" ? content.docType : undefined;
  const project = entry.projectId ? getProject(entry.projectId) : undefined;
  const stack = Array.isArray(frontmatter.stack) ? frontmatter.stack.map(String) : [];

  return (
    <dl className={styles.meta} aria-label="Document properties">
      {docType && (
        <div>
          <dt>type</dt>
          <dd>{DOC_TYPE_LABEL[docType] ?? docType}</dd>
        </div>
      )}
      {docType === "technical-requirements" && project && (
        <div>
          <dt>project</dt>
          <dd>
            <Link to={`/portfolio/${project.id}`}>{project.title}</Link>
          </dd>
        </div>
      )}
      {frontmatter.role && (
        <div>
          <dt>role</dt>
          <dd>{frontmatter.role}</dd>
        </div>
      )}
      {stack.length > 0 && (
        <div>
          <dt>stack</dt>
          <dd>
            <ul className={styles.tags}>
              {stack.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </dd>
        </div>
      )}
      {docType === "readme" && project && (
        <div>
          <dt>views</dt>
          <dd>{project.views.length}</dd>
        </div>
      )}
      {frontmatter.status && (
        <div>
          <dt>status</dt>
          <dd>
            <span className={styles.status} data-status={frontmatter.status}>
              {frontmatter.status}
            </span>
          </dd>
        </div>
      )}
    </dl>
  );
}
