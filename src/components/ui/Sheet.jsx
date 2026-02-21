import React, { createContext, useContext, useState } from "react";
// useSheet is used by children to close the sheet programmatically
import { cn } from "@/lib/utils";

const SheetContext = createContext({ open: false, setOpen: () => {} });
export function useSheet() {
  return useContext(SheetContext);
}

function Sheet({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

function SheetTrigger({ children, asChild, ...props }) {
  const { setOpen } = useContext(SheetContext);
  const openSheet = () => setOpen(true);
  const handleKeyDown = (e) => { if (e.key === "Enter") setOpen(true); };
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => { children.props.onClick?.(e); openSheet(); },
      onKeyDown: (e) => { children.props.onKeyDown?.(e); handleKeyDown(e); },
      role: "button",
      tabIndex: 0,
    });
  }
  return (
    <div role="button" tabIndex={0} onClick={openSheet} onKeyDown={handleKeyDown} {...props}>
      {children}
    </div>
  );
}

function SheetContent({ side = "right", className, children }) {
  const { open, setOpen } = useContext(SheetContext);
  if (!open) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-background p-6 w-3/4 max-w-md border-border shadow-dropdown dark:shadow-dropdown-dark transition-[transform,opacity] duration-200 ease-in-out",
          side === "left" && "left-0 top-0 h-full border-r",
          side === "right" && "right-0 top-0 h-full border-l",
          className
        )}
      >
        {children}
      </div>
    </>
  );
}

export { Sheet, SheetTrigger, SheetContent };
