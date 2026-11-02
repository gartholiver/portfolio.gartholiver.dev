import { useId, type ReactNode } from "react";
import styles from "./DemoFrame.module.css";

export interface DemoFrameProps {
  /** Panel title (the page's h1). */
  title: string;
  /** Short context shown on the right of the panel header (project name, week, …). */
  meta?: string;
  /** Pill text above the panel. Always states that the content is sample data. */
  badge?: string;
  /** One line beside the pill, e.g. "Interactive example with fictional records". */
  description: string;
  children: ReactNode;
}

/**
 * The light "demo application panel" that sits inside the dark editor shell. Every view page
 * (interactive demos and placeholders alike) renders inside it, so the sample-data label and the
 * light, WCAG-AA palette live in one place. Demos only provide the panel body (`children`).
 */
export function DemoFrame({ title, meta, badge = "Sample data", description, children }: DemoFrameProps) {
  const titleId = useId();
  return (
    <div className={styles.frame}>
      <div className={styles.labelRow}>
        <span className={styles.badge}>{badge}</span>
        <span className={styles.description}>{description}</span>
      </div>
      <section className={styles.panel} aria-labelledby={titleId}>
        <header className={styles.header}>
          <h1 id={titleId} className={styles.title}>
            {title}
          </h1>
          {meta && <p className={styles.meta}>{meta}</p>}
        </header>
        <div className={styles.body}>{children}</div>
      </section>
    </div>
  );
}
