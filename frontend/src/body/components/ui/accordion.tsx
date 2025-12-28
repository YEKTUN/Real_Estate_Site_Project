'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionContextValue {
  value: string[];
  onValueChange: (value: string[]) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(undefined);

interface AccordionProps {
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  children: React.ReactNode;
  className?: string;
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ type = 'single', defaultValue, value: valueProp, onValueChange, children, className, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string[]>(() => {
      if (defaultValue === undefined) return [];
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
    });

    const value = React.useMemo(() => {
      if (valueProp !== undefined) {
        return Array.isArray(valueProp) ? valueProp : [valueProp];
      }
      return internalValue;
    }, [valueProp, internalValue]);

    const handleValueChange = React.useCallback(
      (newValue: string[]) => {
        if (valueProp === undefined) {
          setInternalValue(newValue);
        }
        if (onValueChange) {
          if (type === 'single') {
            onValueChange(newValue[0] || '');
          } else {
            onValueChange(newValue);
          }
        }
      },
      [valueProp, onValueChange, type]
    );

    return (
      <AccordionContext.Provider value={{ value, onValueChange: handleValueChange, type }}>
        <div ref={ref} className={cn('w-full', className)} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);
Accordion.displayName = 'Accordion';

interface AccordionItemContextValue {
  value: string;
  disabled?: boolean;
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | undefined>(undefined);

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, children, className, disabled, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    if (!context) {
      throw new Error('AccordionItem must be used within Accordion');
    }

    const isOpen = context.value.includes(value);

    return (
      <AccordionItemContext.Provider value={{ value, disabled }}>
        <div
          ref={ref}
          className={cn('border-b border-gray-200', disabled && 'opacity-50 pointer-events-none', className)}
          data-state={isOpen ? 'open' : 'closed'}
          {...props}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  }
);
AccordionItem.displayName = 'AccordionItem';

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    if (!context) {
      throw new Error('AccordionTrigger must be used within Accordion');
    }

    const itemContext = React.useContext(AccordionItemContext);
    if (!itemContext) {
      throw new Error('AccordionTrigger must be used within AccordionItem');
    }

    const { value, disabled } = itemContext;
    const { value: openValues, onValueChange, type } = context;
    const isOpen = openValues.includes(value);

    const handleClick = () => {
      if (disabled) return;
      
      let newValue: string[];
      if (type === 'single') {
        newValue = isOpen ? [] : [value];
      } else {
        newValue = isOpen ? openValues.filter((v) => v !== value) : [...openValues, value];
      }
      onValueChange(newValue);
    };

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'flex w-full items-center justify-between py-4 px-4 font-medium transition-all duration-300 ease-in-out',
          'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
          'disabled:pointer-events-none disabled:opacity-50',
          isOpen && 'bg-gray-50',
          className
        )}
        aria-expanded={isOpen}
        {...props}
      >
        {children}
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-gray-500 transition-transform duration-500 ease-in-out',
            isOpen && 'rotate-180'
          )}
        />
      </button>
    );
  }
);
AccordionTrigger.displayName = 'AccordionTrigger';

const AccordionContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    if (!context) {
      throw new Error('AccordionContent must be used within Accordion');
    }

    const itemContext = React.useContext(AccordionItemContext);
    if (!itemContext) {
      throw new Error('AccordionContent must be used within AccordionItem');
    }

    const { value } = itemContext;
    const isOpen = context.value.includes(value);

    return (
      <div
        ref={ref}
        className={cn(
          'overflow-hidden transition-all duration-500 ease-in-out',
          isOpen ? 'max-h-[5000px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2'
        )}
        data-state={isOpen ? 'open' : 'closed'}
        style={{
          transitionProperty: 'max-height, opacity, transform',
        }}
        {...props}
      >
        <div className={cn('pb-4 px-4 pt-0', className)}>{children}</div>
      </div>
    );
  }
);
AccordionContent.displayName = 'AccordionContent';

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };

