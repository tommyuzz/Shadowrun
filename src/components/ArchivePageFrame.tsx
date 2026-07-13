import { useEffect, useState, type ReactNode } from "react";
import { motionIsReduced } from "../motion";

interface ArchivePageFrameProps {
  children: ReactNode;
  className: string;
  moduleId?: string;
  motionKey: string;
}

/**
 * Removes completed animation declarations after the entry sequence. This
 * releases compositor layers and returns the settled archive to the exact
 * original raster presentation.
 */
export function ArchivePageFrame({ children, className, moduleId, motionKey }: ArchivePageFrameProps) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    setSettled(false);
    const timer = window.setTimeout(() => setSettled(true), motionIsReduced() ? 0 : 900);
    return () => window.clearTimeout(timer);
  }, [motionKey]);

  return <div
    className={`${className}${settled ? " archive-motion-settled" : ""}`}
    data-archive-module={moduleId}
  >{children}</div>;
}
