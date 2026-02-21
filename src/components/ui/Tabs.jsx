import { useState, createContext, useContext } from "react";
import { cn } from "@/lib/utils";

const TabsContext = createContext({ value: "", onValueChange: () => {}, variant: "default" });

export function Tabs({ defaultValue, value: controlledValue, onValueChange, variant = "default", className, children }) {
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const handleChange = (v) => {
    if (controlledValue === undefined) setInternalValue(v);
    onValueChange?.(v);
  };
  return (
    <TabsContext.Provider value={{ value, onValueChange: handleChange, variant }}>
      <div className={cn("space-y-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }) {
  const ctx = useContext(TabsContext);
  const isPill = ctx.variant === "pill";
  return (
    <div
      className={cn(
        isPill
          ? "flex flex-wrap gap-2 rounded-xl bg-muted/30 p-2 text-muted-foreground w-full"
          : "inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ value, className, children, ...props }) {
  const ctx = useContext(TabsContext);
  const isActive = ctx.value === value;
  const isPill = ctx.variant === "pill";
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap text-sm transition-all duration-[var(--duration-ui)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50",
        isPill && "rounded-lg px-4 py-2",
        isPill && isActive && "bg-card text-foreground font-semibold shadow-sm",
        isPill && !isActive && "bg-transparent font-normal text-muted-foreground hover:bg-card/50 hover:text-foreground",
        !isPill && "rounded-[var(--radius)] px-3 py-1.5 font-medium",
        !isPill && isActive && "bg-background text-foreground shadow",
        !isPill && !isActive && "hover:bg-background/50 hover:text-foreground",
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
