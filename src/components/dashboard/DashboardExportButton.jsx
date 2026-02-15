import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Download } from "lucide-react";
import api from "@/services/api";
import { success, error as notifyError } from "@/utils/notify";

export function DashboardExportButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/v1/stats/projects");
      const data = res.data?.data ?? res.data;
      const rows = Array.isArray(data) ? data : typeof data === "object" && data !== null ? [data] : [];
      const headers =
        rows.length && typeof rows[0] === "object" ? Object.keys(rows[0]) : ["total", "active", "completed", "urgent"];
      const csvRows = [headers.join(",")];
      for (const row of rows) {
        const r = typeof row === "object" ? row : {};
        csvRows.push(headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","));
      }
      const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stats-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success("Stats exported successfully");
    } catch (err) {
      notifyError(err?.response?.data?.error || "Failed to export stats");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={isLoading}>
      <Download className="mr-2 h-4 w-4" />
      {isLoading ? "Exporting..." : "Export Stats"}
    </Button>
  );
}
