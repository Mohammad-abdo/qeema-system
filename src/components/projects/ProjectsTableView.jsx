import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EditProjectModal } from "./EditProjectModal";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { PROJECT_STATUS_COLORS, getProjectTypeColor } from "@/lib/statusColors";
import { cn } from "@/lib/utils";

export function ProjectsTableView({ projects, total, page, limit, onPageChange, onProjectUpdated }) {
  const { t } = useTranslation();
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [editingProject, setEditingProject] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditClick = (project) => {
    setEditingProject(project);
    setIsEditModalOpen(true);
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedProjects = useMemo(() => {
    if (!sortField) return projects;
    return [...projects].sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case "name":
          aVal = (a.name || "").toLowerCase();
          bVal = (b.name || "").toLowerCase();
          return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        case "status":
          aVal = (a.status || "").toLowerCase();
          bVal = (b.status || "").toLowerCase();
          return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        case "startDate":
          aVal = a.startDate ? new Date(a.startDate).getTime() : 0;
          bVal = b.startDate ? new Date(b.startDate).getTime() : 0;
          return sortDir === "asc" ? aVal - bVal : bVal - aVal;
        case "endDate":
          aVal = a.endDate ? new Date(a.endDate).getTime() : 0;
          bVal = b.endDate ? new Date(b.endDate).getTime() : 0;
          return sortDir === "asc" ? aVal - bVal : bVal - aVal;
        default:
          return 0;
      }
    });
  }, [projects, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const SortHeader = ({ field, label }) => (
    <TableHead>
      <button
        type="button"
        className="flex items-center gap-1 font-medium hover:text-foreground"
        onClick={() => handleSort(field)}
      >
        {label}
        {sortField === field ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
      </button>
    </TableHead>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader field="name" label={t("projects.projectName")} />
              <TableHead>{t("projects.category")}</TableHead>
              <SortHeader field="status" label={t("common.status")} />
              <SortHeader field="startDate" label={t("projects.startDate")} />
              <SortHeader field="endDate" label={t("projects.endDate")} />
              <TableHead>{t("projects.projectManager")}</TableHead>
              <TableHead>{t("projects.tasksCount")}</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProjects.map((project) => (
              <TableRow key={project.id} className="hover:bg-muted/50">
                <TableCell>
                  <Link to={`/dashboard/projects/${project.id}`} className="font-medium hover:underline">
                    {project.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-xs capitalize", getProjectTypeColor(project.type || project.projectType?.name))}>
                    {project.type || project.projectType?.name || "—"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn("text-xs", PROJECT_STATUS_COLORS[project.status] || "bg-muted text-muted-foreground border-border")}>
                    {(project.status || "—").replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {project.startDate ? format(new Date(project.startDate), "MMM d, yyyy") : "—"}
                </TableCell>
                <TableCell>
                  {project.endDate ? format(new Date(project.endDate), "MMM d, yyyy") : "—"}
                </TableCell>
                <TableCell>
                  {project.projectManager?.username ?? "—"}
                </TableCell>
                <TableCell>
                  <span className="text-sm">{project._count?.tasks ?? 0}</span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEditClick(project)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Project
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            {t("common.previous")}
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            {t("projects.pageOf", { page, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          >
            {t("common.next")}
          </Button>
        </div>
      )}

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onProjectUpdated={onProjectUpdated}
        />
      )}
    </div>
  );
}
