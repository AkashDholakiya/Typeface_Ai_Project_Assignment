import React from 'react';
import { cn } from '../../utils/cn';

const Select = ({ value, onValueChange, children, ...props }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div ref={selectRef} className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            value,
            onValueChange,
            isOpen,
            setIsOpen,
            ...props
          });
        }
        return child;
      })}
    </div>
  );
};

const SelectTrigger = React.forwardRef(({ className, children, value, isOpen, setIsOpen, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setIsOpen?.(!isOpen)}
      className={cn(
        'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { value });
        }
        return child;
      })}
      <svg
        className={cn(
          'h-4 w-4 transition-transform',
          isOpen && 'rotate-180'
        )}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

const SelectValue = React.forwardRef(({ className, placeholder, value, children, ...props }, ref) => {
  const displayValue = value || placeholder;
  
  return (
    <span
      ref={ref}
      className={cn('block truncate', !value && 'text-muted-foreground', className)}
      {...props}
    >
      {children || displayValue}
    </span>
  );
});
SelectValue.displayName = 'SelectValue';

const SelectContent = React.forwardRef(({ className, children, value, onValueChange, isOpen, setIsOpen, ...props }, ref) => {
  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md',
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            currentValue: value,
            onSelect: (itemValue) => {
              onValueChange?.(itemValue);
              setIsOpen?.(false);
            }
          });
        }
        return child;
      })}
    </div>
  );
});
SelectContent.displayName = 'SelectContent';

const SelectItem = React.forwardRef(({ className, children, value, currentValue, onSelect, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      currentValue === value && 'bg-accent',
      className
    )}
    onClick={() => onSelect?.(value)}
    {...props}
  >
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      {currentValue === value && (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </span>
    {children}
  </div>
));
SelectItem.displayName = 'SelectItem';

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
