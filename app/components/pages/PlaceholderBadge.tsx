import styles from "./Page.module.css";

/** Visible tag for content that is not final. Pairs with "[Placeholder]" text in the copy. */
export function PlaceholderBadge({ children = "Placeholder" }: { children?: string }) {
  return <span className={styles.badge}>{children}</span>;
}
