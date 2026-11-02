import { Link } from "react-router";
import { projects, routeEntries } from "~/content/registry";
import { home } from "~/data/home";
import { useShell } from "~/components/shell/ShellContext";
import { PlaceholderBadge } from "./PlaceholderBadge";
import shared from "./Page.module.css";
import styles from "./HomePage.module.css";

export function HomePage() {
  const { openContact } = useShell();
  const demo = routeEntries.find((e) => e.kind === "demo");
  const demoTotal = routeEntries.filter((e) => e.kind === "demo").length;

  return (
    <article className={shared.page}>
      <p className={shared.eyebrow}>{home.eyebrow}</p>
      <h1>{home.heading}</h1>
      <p className={shared.lead}>
        {home.intro} <PlaceholderBadge />
      </p>
      <p>{home.introNote}</p>

      <div className={shared.callout} data-variant="placeholder" role="note">
        <p>
          <strong>Placeholder content</strong> — {home.placeholderCallout}
        </p>
      </div>

      <div className={shared.props} aria-label="Site properties" role="group">
        <span>
          type: <b>portfolio</b>
        </span>
        <span>
          projects: <b>{projects.length}</b>
        </span>
        <span>
          status: <b>placeholder content</b>
        </span>
      </div>

      <section aria-labelledby="home-projects">
        <h2 id="home-projects" className={styles.h2First}>
          Projects
        </h2>
        <p>{home.projectsIntro}</p>
        <ul className={styles.cards}>
          {projects.map((project) => {
            const demoCount = project.views.filter((v) => v.demoId).length;
            return (
              <li key={project.id} className={styles.card}>
                <h3 className={styles.cardTitle}>
                  <Link to={`/portfolio/${project.id}`} className={styles.cardLink}>
                    {project.title}
                  </Link>
                </h3>
                <p className={styles.path}>portfolio/{project.folder}/README.md</p>
                <p className={styles.blurb}>{home.projectBlurbs[project.id]}</p>
                <p className={styles.cardMeta}>
                  {project.views.length} example views
                  {demoCount
                    ? ` · ${demoCount} interactive ${demoCount === 1 ? "demo" : "demos"}`
                    : " · placeholder panels"}
                </p>
                <p className={styles.cardTags}>
                  {project.tags.map((t) => `#${t.toLowerCase().replace(/\s+/g, "-")}`).join(" ")}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="home-explore">
        <h2 id="home-explore" className={styles.h2}>
          {home.exploreHeading}
        </h2>
        <ol className={styles.steps}>
          {home.exploreSteps.map((step) => (
            <li key={step.title} className={styles.step}>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepBody}>{typeof step.body === "function" ? step.body(demoTotal) : step.body}</p>
            </li>
          ))}
        </ol>
        <p className={styles.quickLinks}>
          Quick links: {demo && <Link to={demo.url}>{demo.title} demo</Link>}
          {demo && " · "}
          <Link to="/search">Search</Link> · <Link to="/stack">Tech stack</Link> · <Link to="/docs/about">About</Link>
        </p>
      </section>

      <section className={styles.contact} aria-labelledby="home-contact">
        <h2 id="home-contact">{home.contactHeading}</h2>
        <p>{home.contactBody}</p>
        <div className={styles.contactActions}>
          <button type="button" className={shared.button} onClick={openContact} aria-describedby="home-contact-note">
            Open contact terminal
          </button>
          <p id="home-contact-note" className={styles.contactNote}>
            Same as opening <code>contact.bash</code> in the docs folder.
          </p>
        </div>
      </section>
    </article>
  );
}
