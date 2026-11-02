import { Link } from "react-router";
import { PlaceholderBadge } from "./PlaceholderBadge";
import shared from "./Page.module.css";
import styles from "./BlogPage.module.css";

/** Blog archive empty state. Phase 1 has no posts and no publishing features. */
export function BlogPage({ title }: { title: string }) {
  return (
    <article className={`${shared.page} ${shared.narrow}`}>
      <p className={shared.eyebrow}>docs/index.html</p>
      <h1>{title}</h1>
      <p className={shared.lead}>Notes, write-ups and articles will be collected here.</p>

      <section className={styles.empty} aria-labelledby="blog-empty">
        <svg className={styles.icon} width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M14 3v4h4M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <PlaceholderBadge>Coming in phase 2</PlaceholderBadge>
        <h2 id="blog-empty">No posts yet</h2>
        <p>
          The blog is planned for phase 2 of this site. Nothing has been published, so there is nothing to browse
          here for now.
        </p>
        <p>In the meantime, the project case studies are the best place to start.</p>
        <ul className={styles.links}>
          <li>
            <Link to="/">Back to the home page</Link>
          </li>
          <li>
            <Link to="/search">Search the site</Link>
          </li>
        </ul>
      </section>
    </article>
  );
}
