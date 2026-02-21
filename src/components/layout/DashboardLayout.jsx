import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavLinks } from "./NavLinks";
import { DashboardBranding } from "./DashboardBranding";
import { UserButton } from "./UserButton";
import { ProjectNotificationsHeader } from "./ProjectNotificationsHeader";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { ReminderToaster } from "@/components/ReminderToaster";
import { Button } from "@/components/ui/Button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet";
import { Menu } from "lucide-react";

export default function DashboardLayout() {
  const { t } = useTranslation();
  return (
    <div className="flex h-screen w-full flex-col md:flex-row">
      {/* Sidebar: subtle border separation, calm background */}
      <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex h-full max-h-screen flex-col">
          <DashboardBranding />
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3">
            <nav className="space-y-1">
              <div className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-sidebar-foreground/70">
                {t("nav.menu")}
              </div>
              <NavLinks />
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header: Sticky + Glassmorphism */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 md:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-colors duration-[var(--duration-ui)]">
          <Sheet>
            <SheetTrigger>
              <Button className="md:hidden" size="icon" variant="outline">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="md:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <DashboardBranding />
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1" />
          <div className="flex items-center gap-4">
            <LanguageSwitch />
            <ProjectNotificationsHeader />
            <UserButton />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-app-bg">
          <Outlet />
        </main>
      </div>
      <ReminderToaster />
    </div>
  );
}
