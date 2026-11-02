import type { CSSProperties } from "react";
import { stack } from "~/data/stack";
import { buildStackLines } from "~/lib/stack-lines";
import shared from "./Page.module.css";
import styles from "./StackPage.module.css";

const lines = buildStackLines(stack);

/**
 * package.json view: a curated, JSON-styled summary of the stack with plain-language notes.
 * Line numbers are decorative (aria-hidden); the code text and notes are real text for screen readers.
 */
export function StackPage({ title }: { title: string }) {
  return (
    <article className={`${shared.page} ${styles.wrap}`}>
      <p className={shared.eyebrow}>package.json</p>
      <h1>{title}</h1>
      <p className={shared.lead}>
        A plain-language summary of the tools I work with, written as a JSON file the way developers keep project
        settings.
      </p>

      <div className={shared.callout} data-variant="placeholder" role="note">
        <p>
          <strong>Placeholder content</strong> — Every entry below is a placeholder marked “to be supplied”, and AI
          preferences are still pending. This is curated display content, separate from this site’s real package file.
        </p>
      </div>

      <h2 id="stack-how" className={styles.how}>
        How to read this
      </h2>
      <ul className={styles.legend}>
        <li>
          <code>"keys"</code> are labels, and what follows the colon is the value.
        </li>
        <li>Curly braces <code>{"{ }"}</code> hold a group of related items.</li>
        <li>The italic note on each line explains it in everyday language.</li>
      </ul>

      <figure className={styles.file} aria-labelledby="stack-file-name">
        <figcaption className={styles.fileHead}>
          <strong id="stack-file-name">package.json</strong>
          <span>JSON · display only · {lines.length} lines</span>
        </figcaption>
        <div className={styles.colHead} aria-hidden="true">
          <span>#</span>
          <span>Code</span>
          <span>In plain language</span>
        </div>
        <ol className={styles.lines} role="list" aria-label="package.json contents with explanations">
          {lines.map((line) => (
            <li
              key={line.number}
              className={styles.line}
              style={{ "--depth": line.depth } as CSSProperties}
            >
              <span className={styles.num} aria-hidden="true">
                {line.number}
              </span>
              <code className={styles.code}>
                {line.tokens.map((token, i) => (
                  <span key={i} className={styles[token.kind]}>
                    {token.text}
                  </span>
                ))}
              </code>
              {line.note && (
                <span className={styles.note} data-pending={/pending|placeholder|to be supplied/i.test(line.note)}>
                  <span className="sr-only">Note: </span>
                  {line.note}
                </span>
              )}
            </li>
          ))}
        </ol>
      </figure>
    </article>
  );
}
