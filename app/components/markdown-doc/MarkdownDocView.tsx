import type { RouteEntry } from "~/content/registry";
import type { RenderedMarkdown } from "~/lib/markdown/render";
import { splitLeadingH1 } from "~/lib/markdown/toc";
import { DocMeta } from "./DocMeta";
import { InlineToc, SideToc } from "./DocToc";
import { MarkdownContent } from "./MarkdownContent";
import styles from "./MarkdownDocView.module.css";

export type MarkdownDocData = Pick<RenderedMarkdown, "frontmatter" | "html" | "toc">;

/**
 * Reading view for project Markdown documents: properties block → title → summary → contents →
 * body. On wide content panels the table of contents moves to a sticky side column; on narrow ones
 * it is a collapsible list under the title (both are in the DOM, CSS container queries pick one).
 */
export function MarkdownDocView({ entry, doc }: { entry: RouteEntry; doc: MarkdownDocData }) {
  const { id, titleHtml, rest } = splitLeadingH1(doc.html);
  const showToc = doc.toc.length >= 2;
  const summary = typeof doc.frontmatter.summary === "string" ? doc.frontmatter.summary : undefined;

  return (
    <article className={styles.doc} data-entry-id={entry.id}>
      <div className={styles.layout}>
        <div className={styles.main}>
          <DocMeta entry={entry} frontmatter={doc.frontmatter} />
          {titleHtml !== null ? (
            <h1 id={id ?? undefined} className={styles.title} dangerouslySetInnerHTML={{ __html: titleHtml }} />
          ) : (
            <h1 className={styles.title}>{entry.title}</h1>
          )}
          {summary && <p className={styles.lead}>{summary}</p>}
          {showToc && <InlineToc toc={doc.toc} />}
          <MarkdownContent html={rest} className={styles.prose} />
        </div>
        {showToc && (
          <aside className={styles.side}>
            <SideToc toc={doc.toc} />
          </aside>
        )}
      </div>
    </article>
  );
}
