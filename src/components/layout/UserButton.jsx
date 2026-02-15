import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function UserButton() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/login");
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <User className="h-4 w-4" />
        <span className="sr-only">{t("common.userMenu")}</span>
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            className={cn(
              "absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-md border bg-card py-1 shadow-md"
            )}
          >
            <div className="px-3 py-2 text-sm">
              <p className="font-medium">{user?.name ?? t("users.user")}</p>
              <p className="text-muted-foreground text-xs">{user?.role ?? "developer"}</p>
            </div>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              {t("auth.logout")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
