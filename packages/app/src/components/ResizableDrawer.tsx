import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const STORAGE_KEY = "bugger-drawer-width";
const DEFAULT_WIDTH = 420;
const MIN_WIDTH = 280;
const MAX_WIDTH = 900;

function readStoredWidth(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_WIDTH;
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? parsed : DEFAULT_WIDTH;
  } catch {
    return DEFAULT_WIDTH;
  }
}

function clampWidth(width: number, containerWidth: number): number {
  const max = Math.min(MAX_WIDTH, Math.floor(containerWidth * 0.75));
  return Math.max(MIN_WIDTH, Math.min(max, width));
}

interface ResizableDrawerProps {
  main: ReactNode;
  drawer: ReactNode;
}

export function ResizableDrawer({ main, drawer }: ResizableDrawerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const drawerWidthRef = useRef(readStoredWidth());
  const [drawerWidth, setDrawerWidth] = useState(readStoredWidth);

  drawerWidthRef.current = drawerWidth;

  const persistWidth = useCallback((width: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(width));
    } catch {
      // Ignore storage errors.
    }
  }, []);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const nextWidth = clampWidth(rect.right - event.clientX, rect.width);
      setDrawerWidth(nextWidth);
    };

    const onPointerUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      const containerWidth = entry?.contentRect.width ?? 0;
      if (!containerWidth) return;
      setDrawerWidth((current) => clampWidth(current, containerWidth));
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const finishResize = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    persistWidth(drawerWidthRef.current);
  };

  return (
    <div
      ref={containerRef}
      className="flex min-h-0 flex-1 flex-col lg:flex-row"
      style={{ "--drawer-width": `${drawerWidth}px` } as React.CSSProperties}
    >
      <div className="min-h-0 min-w-0 flex-1">{main}</div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize drawer"
        className="group relative hidden w-1 shrink-0 cursor-col-resize bg-slate-800 lg:block"
        onPointerDown={startResize}
        onPointerUp={finishResize}
        onPointerCancel={finishResize}
      >
        <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-red-500/20 group-active:bg-red-500/30" />
      </div>

      <aside className="flex min-h-0 w-full flex-col overflow-hidden border-t border-slate-800 lg:w-[var(--drawer-width)] lg:shrink-0 lg:border-l lg:border-t-0">
        {drawer}
      </aside>
    </div>
  );
}
