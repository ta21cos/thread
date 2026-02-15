import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({ open, onOpenChange, children }) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
        role="button"
        tabIndex={-1}
        aria-label="Close sidebar"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onOpenChange(false);
          }
        }}
      />
      <div className="relative z-50">{children}</div>
    </div>
  );
};

interface SheetContentProps {
  children: React.ReactNode;
  className?: string;
  side?: 'left' | 'right';
  onClose?: () => void;
}

export const SheetContent: React.FC<SheetContentProps> = ({
  children,
  className,
  side = 'left',
  onClose,
}) => {
  return (
    <div
      className={cn(
        'fixed inset-y-0 z-50 flex flex-col bg-background shadow-lg',
        'animate-in duration-200',
        side === 'left' ? 'left-0 slide-in-from-left' : 'right-0 slide-in-from-right',
        'w-72',
        className
      )}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
      {children}
    </div>
  );
};
