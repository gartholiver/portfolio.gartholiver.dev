import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";

/** Below this width the explorer becomes a drawer. */
export const DRAWER_BREAKPOINT = 900;
const DRAWER_QUERY = `(max-width: ${DRAWER_BREAKPOINT - 0.02}px)`;

export type DrawerFocusTarget = "trigger" | "content";

export interface ShellContextValue {
  /** Effective expanded state of the contact terminal panel. */
  terminalOpen: boolean;
  /** True until the user (or `openContact`) explicitly opens/collapses it. */
  terminalIsDefault: boolean;
  /** Explicitly open or collapse the terminal. Overrides the viewport-based default. */
  setTerminalOpen: (open: boolean) => void;
  toggleTerminal: () => void;
  /**
   * Open the contact terminal (if collapsed) alongside the current page and move focus into it.
   * Never navigates. Also closes the navigation drawer.
   */
  openContact: () => void;
  /** Bumps on every `openContact()` call; the terminal panel moves focus when it changes. */
  contactFocusRequest: number;

  /** Navigation drawer state. Only meaningful when `isDrawerLayout` is true. */
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  openDrawer: () => void;
  /** Close the drawer; `focus` says where focus goes afterwards (default: the menu button). */
  closeDrawer: (focus?: DrawerFocusTarget) => void;
  /** True below 900px (drawer layout). Always false during prerender. */
  isDrawerLayout: boolean;

  /** Elements registered by the shell so focus can be restored after the drawer closes. */
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  contentRef: RefObject<HTMLElement | null>;
}

const ShellContext = createContext<ShellContextValue | null>(null);

function subscribe(onChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mql = window.matchMedia(DRAWER_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}
const getSnapshot = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(DRAWER_QUERY).matches;
const getServerSnapshot = () => false;

/** True below 900px. Server/prerender value is false (desktop); CSS covers the pre-hydration state. */
export function useIsDrawerLayout(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function ShellProvider({ children }: { children: ReactNode }) {
  const isDrawerLayout = useIsDrawerLayout();

  // `null` = no explicit choice yet → the terminal starts collapsed on every viewport (also in the prerendered HTML).
  const [terminalChoice, setTerminalChoice] = useState<boolean | null>(null);
  const terminalOpen = terminalChoice ?? false;
  const [contactFocusRequest, setContactFocusRequest] = useState(0);

  const [drawerOpenState, setDrawerOpenState] = useState(false);
  const drawerOpen = drawerOpenState && isDrawerLayout;

  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);
  const focusTargetRef = useRef<DrawerFocusTarget>("trigger");
  const wasOpenRef = useRef(false);

  // Leaving the drawer layout (resize/rotate) resets the drawer.
  useEffect(() => {
    if (!isDrawerLayout) setDrawerOpenState(false);
  }, [isDrawerLayout]);

  // After the drawer closes, put focus somewhere sensible — unless something else (e.g. the
  // terminal after openContact) already took it. Child effects run first, so that case is covered.
  useEffect(() => {
    if (wasOpenRef.current && !drawerOpen) {
      const active = document.activeElement;
      const lost = !active || active === document.body || active.closest("[data-shell-drawer]") !== null;
      if (lost) {
        const target = focusTargetRef.current === "content" ? contentRef.current : menuButtonRef.current;
        (target ?? menuButtonRef.current)?.focus({ preventScroll: true });
      }
      focusTargetRef.current = "trigger";
    }
    if (drawerOpen && !wasOpenRef.current) focusTargetRef.current = "trigger";
    wasOpenRef.current = drawerOpen;
  }, [drawerOpen]);

  const setTerminalOpen = useCallback((open: boolean) => setTerminalChoice(open), []);
  const toggleTerminal = useCallback(() => setTerminalChoice(!terminalOpen), [terminalOpen]);

  const setDrawerOpen = useCallback((open: boolean) => setDrawerOpenState(open), []);
  const openDrawer = useCallback(() => setDrawerOpenState(true), []);
  const closeDrawer = useCallback((focus: DrawerFocusTarget = "trigger") => {
    focusTargetRef.current = focus;
    setDrawerOpenState(false);
  }, []);

  const openContact = useCallback(() => {
    setTerminalChoice(true);
    setDrawerOpenState(false);
    setContactFocusRequest((n) => n + 1);
  }, []);

  const value = useMemo<ShellContextValue>(
    () => ({
      terminalOpen,
      terminalIsDefault: terminalChoice === null,
      setTerminalOpen,
      toggleTerminal,
      openContact,
      contactFocusRequest,
      drawerOpen,
      setDrawerOpen,
      openDrawer,
      closeDrawer,
      isDrawerLayout,
      menuButtonRef,
      contentRef,
    }),
    [
      terminalOpen,
      terminalChoice,
      setTerminalOpen,
      toggleTerminal,
      openContact,
      contactFocusRequest,
      drawerOpen,
      setDrawerOpen,
      openDrawer,
      closeDrawer,
      isDrawerLayout,
    ],
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside <ShellProvider>");
  return ctx;
}
