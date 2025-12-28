'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | undefined>(undefined);

interface CollapsibleProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ open: openProp, defaultOpen = false, onOpenChange, children, className, ...props }, ref) => {
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
    const open = openProp !== undefined ? openProp : internalOpen;
    const setOpen = React.useCallback(
      (value: boolean) => {
        if (openProp === undefined) {
          setInternalOpen(value);
        }
        onOpenChange?.(value);
      },
      [openProp, onOpenChange]
    );

    return (
      <CollapsibleContext.Provider value={{ open, onOpenChange: setOpen }}>
        <div ref={ref} className={cn('w-full', className)} {...props}>
          {children}
        </div>
      </CollapsibleContext.Provider>
    );
  }
);
Collapsible.displayName = 'Collapsible';

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
  }
>(({ className, children, asChild, ...props }, ref) => {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error('CollapsibleTrigger must be used within Collapsible');
  }

  const { open, onOpenChange } = context;

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: () => onOpenChange(!open),
      ...props,
    } as any);
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onOpenChange(!open)}
      className={cn(
        'flex w-full items-center justify-between rounded-lg px-4 py-3 text-left font-medium transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn(
          'h-4 w-4 transition-transform duration-200',
          open && 'rotate-180'
        )}
      />
    </button>
  );
});
CollapsibleTrigger.displayName = 'CollapsibleTrigger';

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error('CollapsibleContent must be used within Collapsible');
  }

  const { open } = context;

  return (
    <div
      ref={ref}
      className={cn(
        'overflow-hidden transition-all duration-300 ease-in-out',
        open ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
      )}
      {...props}
    >
      <div className={cn('py-4', className)}>{children}</div>
    </div>
  );
});
CollapsibleContent.displayName = 'CollapsibleContent';

export { Collapsible, CollapsibleTrigger, CollapsibleContent };

