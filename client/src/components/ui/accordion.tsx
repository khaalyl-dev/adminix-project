import * as React from 'react';

export function Accordion({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>;
}

export function AccordionItem({ value, children }: { value: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === AccordionTrigger) {
          return React.cloneElement(child, { onClick: () => setOpen(o => !o), open });
        }
        if (React.isValidElement(child) && child.type === AccordionContent) {
          return open ? child : null;
        }
        return child;
      })}
    </div>
  );
}

export function AccordionTrigger({ children, onClick, open }: { children: React.ReactNode; onClick?: () => void; open?: boolean }) {
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onClick}
      className="w-full flex items-center justify-between py-2 px-3 font-semibold text-sm bg-gray-50 border-b border-gray-200 rounded-t focus:outline-none"
    >
      {children}
      <span className={`ml-2 transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
    </button>
  );
}

export function AccordionContent({ children }: { children: React.ReactNode }) {
  return <div className="p-3 bg-white">{children}</div>;
} 