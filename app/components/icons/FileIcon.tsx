import type { ComponentType, SVGProps } from "react";
import FileGeneric from "~icons/file-icons/file";
import FolderGeneric from "~icons/file-icons/folder";
import FolderGenericOpen from "~icons/file-icons/folder-open";
import Console from "~icons/material-icon-theme/console";
import FolderDocs from "~icons/material-icon-theme/folder-docs";
import FolderDocsOpen from "~icons/material-icon-theme/folder-docs-open";
import FolderProject from "~icons/material-icon-theme/folder-project";
import FolderProjectOpen from "~icons/material-icon-theme/folder-project-open";
import FolderViews from "~icons/material-icon-theme/folder-views";
import FolderViewsOpen from "~icons/material-icon-theme/folder-views-open";
import Html from "~icons/material-icon-theme/html";
import Json from "~icons/material-icon-theme/json";
import Markdown from "~icons/material-icon-theme/markdown";
import Npm from "~icons/material-icon-theme/npm";
import ReactTs from "~icons/material-icon-theme/react-ts";
import Readme from "~icons/material-icon-theme/readme";
import type { FileIconKind, FolderIconKind, IconKind } from "~/components/shell/explorer-state";
import styles from "./FileIcon.module.css";

type Svg = ComponentType<SVGProps<SVGSVGElement>>;

const FILE_ICONS: Record<FileIconKind, Svg> = {
  md: Markdown,
  readme: Readme,
  html: Html,
  json: Json,
  npm: Npm,
  tsx: ReactTs,
  terminal: Console,
  default: FileGeneric,
};

const FOLDER_ICONS: Record<FolderIconKind, { closed: Svg; open: Svg }> = {
  folder: { closed: FolderGeneric, open: FolderGenericOpen },
  "folder-docs": { closed: FolderDocs, open: FolderDocsOpen },
  "folder-project": { closed: FolderProject, open: FolderProjectOpen },
  "folder-views": { closed: FolderViews, open: FolderViewsOpen },
};

function isFolderKind(kind: IconKind): kind is FolderIconKind {
  return kind in FOLDER_ICONS;
}

/**
 * VS Code-style file-type icon (Material Icon Theme), inlined as SVG at build time. Decorative:
 * the file/folder name next to it carries the meaning. Shared by the explorer, the editor tab and the breadcrumb.
 */
export function FileIcon({ kind, open = false, className }: { kind: IconKind; open?: boolean; className?: string }) {
  const Icon = isFolderKind(kind) ? FOLDER_ICONS[kind][open ? "open" : "closed"] : FILE_ICONS[kind];
  return (
    <Icon
      className={className ? `${styles.icon} ${className}` : styles.icon}
      data-icon={kind}
      data-open={isFolderKind(kind) ? open : undefined}
      aria-hidden="true"
      focusable="false"
    />
  );
}
