import { Link } from "react-router";
import { viewPlaceholderCommon as copy, type ViewPlaceholder } from "~/content/view-placeholders";
import styles from "./PlaceholderPanel.module.css";

/** Body of the demo frame for a non-demo view. All copy comes from app/content/view-placeholders.ts. */
export function PlaceholderPanel({ placeholder, readmeUrl }: { placeholder: ViewPlaceholder; readmeUrl: string | null }) {
  return (
    <div className={styles.panel}>
      <section>
        <h2 className={styles.label}>{copy.summaryLabel}</h2>
        <p className={styles.summary}>{placeholder.summary}</p>
      </section>
      <section>
        <h2 className={styles.label}>{copy.statusLabel}</h2>
        <p className={styles.status}>{copy.status}</p>
      </section>
      {readmeUrl && (
        <p className={styles.back}>
          <Link to={readmeUrl}>{copy.readmeLinkLabel}</Link>
        </p>
      )}
    </div>
  );
}
