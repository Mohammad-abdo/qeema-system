import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { LayoutGrid, Table } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProjectsViewSwitcher({ viewMode, onViewChange }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1 border border-border rounded-[var(--radius)] p-1">
      <Button
        variant={viewMode === "card" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("card")}
        className={cn("h-8", viewMode === "card" && "bg-primary text-primary-foreground")}
      >
        <LayoutGrid className="h-4 w-4 me-2" />
        {t("projects.viewCards")}
      </Button>
      <Button
        variant={viewMode === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("table")}
        className={cn("h-8", viewMode === "table" && "bg-primary text-primary-foreground")}
      >
        <Table className="h-4 w-4 me-2" />
        {t("projects.viewTable")}
      </Button>
    </div>
  );
}
