import { ShellLayout } from "~/components/shell/ShellLayout";
import { ShellProvider } from "~/components/shell/ShellContext";

/**
 * Persistent layout route — stays mounted across navigation, so the explorer's expanded folders,
 * the terminal (and, later, the contact draft) and drawer state survive page changes.
 * Pages render into the scrolling content panel via <Outlet /> (see ContentPanel).
 */
export default function Shell() {
  return (
    <ShellProvider>
      <ShellLayout />
    </ShellProvider>
  );
}
