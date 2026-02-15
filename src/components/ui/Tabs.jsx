import { useState, createContext, useContext } from "react";
import { cn } from "@/lib/utils";

const TabsContext = createContext({ value: "", onValueChange: () => {} });

export function Tabs({ defaultValue, value: controlledValue, onValueChange, className, children }) {
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const handleChange = (v) => {
    if (controlledValue === undefined) setInternalValue(v);
    onValueChange?.(v);
  };
  return (
    <TabsContext.Provider value={{ value, onValueChange: handleChange }}>
      <div className={cn("space-y-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ value, className, children, ...props }) {
  const ctx = useContext(TabsContext);
  const isActive = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-background text-foreground shadow" : "hover:bg-background/50 hover:text-foreground",
        className
      )}
      onClick={() => ctx.onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children, ...props }) {
  const ctx = useContext(TabsContext);
  if (ctx.value !== value) return null;
  return (
    <div role="tabpanel" className={cn("mt-4 focus-visible:outline-none", className)} {...props}>
      {children}
    </div>
  );
}
