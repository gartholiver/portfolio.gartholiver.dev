import { profile } from "~/data/profile";
import { useShell } from "~/components/shell/ShellContext";
import { PlaceholderBadge } from "./PlaceholderBadge";
import shared from "./Page.module.css";
import styles from "./AboutPage.module.css";

export function AboutPage({ title }: { title: string }) {
  const { openContact } = useShell();

  return (
    <article className={shared.page}>
      <p className={shared.eyebrow}>docs/about.html</p>
      <h1>{title}</h1>
      <p className={shared.lead}>
        {profile.name} — {profile.headline} <PlaceholderBadge />
      </p>

      <div className={shared.callout} data-variant="placeholder" role="note">
        <p>
          <strong>Placeholder content</strong> — This page shows the finished layout only. The biography and
          experience below are marked slots; nothing here describes real roles, employers, dates or achievements yet.
        </p>
      </div>

      <div className={styles.layout}>
        <div>
          <section aria-labelledby="about-bio">
            <h2 id="about-bio" className={styles.h2First}>
              Biography
            </h2>
            {profile.biography.map((paragraph, i) => (
              <div key={i} className={styles.slot}>
                <div className={styles.slotHead}>
                  <PlaceholderBadge>Biography placeholder</PlaceholderBadge>
                </div>
                <p>{paragraph}</p>
              </div>
            ))}
          </section>

          <section aria-labelledby="about-experience">
            <h2 id="about-experience" className={styles.h2}>
              Experience
            </h2>
            <ol className={styles.timeline}>
              {profile.experience.map((item, i) => (
                <li key={i} className={styles.entry}>
                  <div className={styles.slotHead}>
                    <PlaceholderBadge>Experience placeholder</PlaceholderBadge>
                    <span className={styles.period}>{item.period}</span>
                  </div>
                  <h3>{item.role}</h3>
                  <p>{item.summary}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className={styles.aside} aria-labelledby="about-facts">
          <h2 id="about-facts">Profile</h2>
          <dl className={styles.facts}>
            <div>
              <dt>name</dt>
              <dd>{profile.name}</dd>
            </div>
            <div>
              <dt>headline</dt>
              <dd>{profile.headline}</dd>
            </div>
            <div>
              <dt>status</dt>
              <dd>
                <PlaceholderBadge>Placeholder content</PlaceholderBadge>
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      <div className={styles.cta}>
        <button type="button" className={shared.button} onClick={openContact}>
          Open contact terminal
        </button>
      </div>
    </article>
  );
}
