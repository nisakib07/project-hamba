"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const THRESHOLD = 70;

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || refreshing) return;
    // Only start if at top of page
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, [isMobile, refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling || refreshing || !isMobile) return;
    currentY.current = e.touches[0].clientY;
    const dist = Math.max(0, currentY.current - startY.current);
    // Dampen the pull
    const dampened = Math.min(dist * 0.5, THRESHOLD * 1.5);
    setPullDistance(dampened);
  }, [pulling, refreshing, isMobile]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling || !isMobile) return;
    setPulling(false);

    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(0);
      try {
        await onRefresh();
      } catch {
        // ignore
      }
      setRefreshing(false);
    } else {
      setPullDistance(0);
    }
  }, [pulling, pullDistance, refreshing, onRefresh, isMobile]);

  const isFlipped = pullDistance >= THRESHOLD;

  return (
    <div
      ref={containerRef}
      className="ptr-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={`ptr-indicator ${pullDistance > 10 ? "visible" : ""} ${refreshing ? "refreshing" : ""}`}
        style={
          !refreshing && pullDistance > 0
            ? { transform: `translateX(-50%) translateY(${pullDistance}px)`, opacity: Math.min(pullDistance / 30, 1) }
            : undefined
        }
      >
        {refreshing ? (
          <div className="ptr-spinner" />
        ) : (
          <span className={`ptr-arrow ${isFlipped ? "flipped" : ""}`}>↓</span>
        )}
      </div>

      {/* Content with slight offset during pull */}
      <div style={
        pullDistance > 0 && !refreshing
          ? { transform: `translateY(${pullDistance * 0.3}px)`, transition: "none" }
          : refreshing
            ? { transform: "translateY(10px)", transition: "transform 0.3s ease" }
            : { transition: "transform 0.3s ease" }
      }>
        {children}
      </div>
    </div>
  );
}
