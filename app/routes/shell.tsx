import { Link, Outlet } from "react-router";
import { buildExplorerTree, type ExplorerNode } from "~/content/registry";

/**
 * Persistent layout route — stays mounted across navigation. The editor shell (title bar,
 * explorer, file header, breadcrumbs, contact terminal, status bar) will be built here.
 * For now it renders a bare explorer list so every page is reachable.
 */
const tree = buildExplorerTree();

function TreeList({ nodes }: { nodes: ExplorerNode[] }) {
  return (
    <ul>
      {nodes.map((node) =>
        node.type === "folder" ? (
          <li key={node.id}>
            {node.name}/
            <TreeList nodes={node.children} />
          </li>
        ) : (
          <li key={node.id}>
            {node.entry.url !== null ? (
              <Link to={node.entry.url}>{node.name}</Link>
            ) : (
              <span>{node.name}</span> /* contact.bash: action wired up with the terminal */
            )}
          </li>
        ),
      )}
    </ul>
  );
}

export default function Shell() {
  return (
    <>
      <nav aria-label="Explorer">
        <TreeList nodes={tree} />
      </nav>
      {/* SHELL: active file header + breadcrumbs go here */}
      <main id="content">
        <Outlet />
      </main>
      {/* SHELL: contact terminal + status bar go here */}
    </>
  );
}
