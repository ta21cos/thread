import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface SplitViewProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultSplitPosition?: number;
  minLeftWidth?: number;
  minRightWidth?: number;
  onSplitChange?: (position: number) => void;
  className?: string;
  showRight?: boolean;
  onCloseRight?: () => void;
}

export const SplitView: React.FC<SplitViewProps> = ({
  left,
  right,
  defaultSplitPosition = 40,
  minLeftWidth = 300,
  minRightWidth = 400,
  onSplitChange,
  className = '',
  showRight = true,
}) => {
  // NOTE: Initialize split position from localStorage synchronously to avoid race conditions
  const [splitPosition, setSplitPosition] = useState(() => {
    const saved = localStorage.getItem('splitView.position');
    if (saved) {
      const position = parseFloat(saved);
      if (position >= 20 && position <= 80) return position;
    }
    return defaultSplitPosition;
  });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // NOTE: Save split position to localStorage
  useEffect(() => {
    localStorage.setItem('splitView.position', splitPosition.toString());
    onSplitChange?.(splitPosition);
  }, [splitPosition, onSplitChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    // NOTE: Add cursor style to body during drag
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;

      // NOTE: Calculate new split position as percentage
      let newPosition = (mouseX / containerWidth) * 100;

      // NOTE: Apply minimum width constraints
      const minLeftPercent = (minLeftWidth / containerWidth) * 100;
      const minRightPercent = (minRightWidth / containerWidth) * 100;

      newPosition = Math.max(minLeftPercent, newPosition);
      newPosition = Math.min(100 - minRightPercent, newPosition);

      // NOTE: Clamp between reasonable bounds
      newPosition = Math.max(20, Math.min(80, newPosition));

      setSplitPosition(newPosition);
    },
    [isDragging, minLeftWidth, minRightWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);

    // NOTE: Reset cursor styles
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // NOTE: Handle keyboard shortcuts for panel resizing
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!e.altKey) return;

    const step = 5; // Percentage step for keyboard adjustment

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        setSplitPosition((prev) => Math.max(20, prev - step));
        break;

      case 'ArrowRight':
        e.preventDefault();
        setSplitPosition((prev) => Math.min(80, prev + step));
        break;

      case '0':
        e.preventDefault();
        setSplitPosition(50); // Reset to center
        break;

      case '1':
        e.preventDefault();
        setSplitPosition(30); // Focus on right panel
        break;

      case '2':
        e.preventDefault();
        setSplitPosition(70); // Focus on left panel
        break;
    }
  }, []);

  // NOTE: Set up and clean up mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // NOTE: Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // NOTE: Recalculate min widths on window resize
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const minLeftPercent = (minLeftWidth / containerWidth) * 100;
        const minRightPercent = (minRightWidth / containerWidth) * 100;

        setSplitPosition((prev) => {
          let adjusted = prev;
          adjusted = Math.max(minLeftPercent, adjusted);
          adjusted = Math.min(100 - minRightPercent, adjusted);
          return adjusted;
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [minLeftWidth, minRightWidth]);

  // NOTE: On mobile, when right panel is shown, hide left panel
  const showLeft = isDesktop || !showRight;
  const shouldShowRight = showRight;

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex relative w-full h-full',
        isDragging && 'select-none cursor-col-resize',
        className
      )}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Left Panel */}
      {showLeft && (
        <div
          ref={leftPanelRef}
          className={cn(
            'h-full overflow-hidden flex',
            isDesktop && shouldShowRight && 'border-r border-border'
          )}
          style={{
            width: isDesktop && shouldShowRight ? `${splitPosition}%` : '100%',
          }}
        >
          {left}
        </div>
      )}

      {/* Divider - only on desktop when right panel is shown */}
      {isDesktop && shouldShowRight && (
        <div
          className={cn(
            'w-2 h-full bg-secondary cursor-col-resize flex items-center justify-center transition-colors',
            'hover:bg-accent relative'
          )}
          onMouseDown={handleMouseDown}
          role="separator"
          aria-label="Resize panels"
          aria-valuenow={splitPosition}
          aria-valuemin={20}
          aria-valuemax={80}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              setSplitPosition((prev) => Math.max(20, prev - 2));
            } else if (e.key === 'ArrowRight') {
              setSplitPosition((prev) => Math.min(80, prev + 2));
            }
          }}
        >
          <div className="h-10 flex flex-col items-center justify-center gap-0.5">
            <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground" />
            <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground" />
            <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground" />
          </div>
        </div>
      )}

      {/* Right Panel */}
      {shouldShowRight && (
        <div
          ref={rightPanelRef}
          className="h-full overflow-hidden flex"
          style={{
            width: isDesktop ? `${100 - splitPosition}%` : '100%',
          }}
        >
          {right}
        </div>
      )}

      {/* NOTE: Keyboard shortcuts hint */}
      <div className="sr-only">
        Keyboard shortcuts: Alt+Left/Right to resize, Alt+0 to reset, Alt+1/2 to focus panels
      </div>
    </div>
  );
};

export default SplitView;
