import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  buildExplorerTree,
  isActionEntry,
  type ExplorerFile,
  type ExplorerFolder,
  type ExplorerNode,
  type RegistryEntry,
} from "~/content/registry";
import { FileIcon } from "~/components/icons/FileIcon";
import { getFileIconKind, getFolderIconKind, getInitialExpanded, revealEntry, toggleFolder, type ExpandedFolders } from "./explorer-state";
import { useShell } from "./ShellContext";
import styles from "./Explorer.module.css";

const tree = buildExplorerTree();

/** Valid, collision-free DOM id for a folder's child list. */
function listId(folderPath: string) {
  return `explorer-list__${folderPath.replace(/\//g, "__")}`;
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg className={styles.chevron} data-expanded={expanded} width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M3 1.5 6.5 5 3 8.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface BranchProps {
  nodes: ExplorerNode[];
  level: number;
  expanded: ExpandedFolders;
  activeId: string | undefined;
  onToggle: (id: string) => void;
  onNavigate: () => void;
  onOpenContact: () => void;
  activeRef: React.RefObject<HTMLAnchorElement | null>;
}

function FolderItem({ node, ...rest }: BranchProps & { node: ExplorerFolder }) {
  const isExpanded = rest.expanded.has(node.id);
  const id = listId(node.path);
  return (
    <li className={styles.item}>
      <button
        type="button"
        className={styles.row}
        style={{ "--level": rest.level } as React.CSSProperties}
        aria-expanded={isExpanded}
        aria-controls={id}
        title={node.path}
        onClick={() => rest.onToggle(node.id)}
      >
        <span className={styles.chevronSlot}>
          <Chevron expanded={isExpanded} />
        </span>
        <FileIcon kind={getFolderIconKind(node.name, node.path)} open={isExpanded} />
        <span className={styles.label}>{node.name}</span>
      </button>
      <ul id={id} role="list" className={styles.list} hidden={!isExpanded}>
        <Branch {...rest} nodes={node.children} level={rest.level + 1} />
      </ul>
    </li>
  );
}

function fileAccessibleName(node: ExplorerFile) {
  const parent = node.path.split("/").slice(0, -1).join(" / ");
  // Many files share names (README.md, index.html) — include the folder so they are distinguishable.
  return parent ? `${node.name} in ${parent}` : node.name;
}

function FileItem({ node, level, activeId, activeRef, onNavigate, onOpenContact }: BranchProps & { node: ExplorerFile }) {
  const entry: RegistryEntry = node.entry;
  const style = { "--level": level } as React.CSSProperties;
  const iconKind = getFileIconKind(node.name);

  if (isActionEntry(entry)) {
    return (
      <li className={styles.item}>
        <button
          type="button"
          className={styles.row}
          style={style}
          title={`${node.path} — opens the contact terminal`}
          aria-controls="terminal-panel"
          onClick={onOpenContact}
        >
          <span className={styles.chevronSlot} />
          <FileIcon kind={iconKind} />
          <span className={styles.label}>{node.name}</span>
          <span className="sr-only"> (opens the contact terminal)</span>
        </button>
      </li>
    );
  }

  const isActive = node.id === activeId;
  return (
    <li className={styles.item}>
      <Link
        ref={isActive ? activeRef : undefined}
        to={entry.url!}
        className={styles.row}
        style={style}
        title={node.path}
        aria-label={fileAccessibleName(node)}
        aria-current={isActive ? "page" : undefined}
        onClick={onNavigate}
      >
        <span className={styles.chevronSlot} />
        <FileIcon kind={iconKind} />
        <span className={styles.label}>{node.name}</span>
      </Link>
    </li>
  );
}

function Branch(props: BranchProps) {
  return (
    <>
      {props.nodes.map((node) =>
        node.type === "folder" ? (
          <FolderItem key={node.id} {...props} node={node} />
        ) : (
          <FileItem key={node.id} {...props} node={node} />
        ),
      )}
    </>
  );
}

interface ExplorerProps {
  /** The registry entry for the current URL (undefined on the 404 page). */
  activeEntry: RegistryEntry | undefined;
  /** Shown only in the drawer layout. */
  onClose?: () => void;
}

/**
 * File explorer. Accessible pattern: a nested list where folders are disclosure buttons
 * (`aria-expanded` / `aria-controls`) and files are links (`aria-current="page"` on the active one).
 * Every row is a normal tab stop; collapsed folders' children are `hidden` so they are skipped.
 */
export function Explorer({ activeEntry, onClose }: ExplorerProps) {
  const { openContact, closeDrawer, drawerOpen } = useShell();
  const [expanded, setExpanded] = useState<ExpandedFolders>(() => getInitialExpanded(activeEntry));
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  // Direct links, refreshes, back/forward and search results all change the active entry:
  // reveal its ancestor folders (adjusting state during render avoids a post-hydration flash).
  const [revealedFor, setRevealedFor] = useState(activeEntry?.id);
  if (revealedFor !== activeEntry?.id) {
    setRevealedFor(activeEntry?.id);
    setExpanded((prev) => revealEntry(prev, activeEntry));
  }

  // Keep the active row visible inside the explorer's own scroll area.
  useEffect(() => {
    activeRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [activeEntry?.id, drawerOpen]);

  return (
    <div className={styles.explorer}>
      <div className={styles.header}>
        <span className={styles.heading}>Explorer</span>
        {onClose && (
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close explorer"
            data-drawer-initial-focus
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
      <nav aria-label="Explorer" className={styles.nav}>
        <ul role="list" className={styles.list}>
          <Branch
            nodes={tree}
            level={0}
            expanded={expanded}
            activeId={activeEntry?.id}
            activeRef={activeRef}
            onToggle={(id) => setExpanded((prev) => toggleFolder(prev, id))}
            onNavigate={() => closeDrawer("content")}
            onOpenContact={openContact}
          />
        </ul>
      </nav>
    </div>
  );
}
