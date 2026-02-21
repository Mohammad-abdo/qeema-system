import { Link } from "react-router-dom";
import { Package2 } from "lucide-react";
import { useSystemSettings } from "@/context/SystemSettingsContext";

export function DashboardBranding() {
  const { settings } = useSystemSettings();
  const showDefaultLogo = !settings.systemLogo || settings.systemLogo === "/assets/logo.png";

  return (
    <div className="flex h-[60px] shrink-0 items-center border-b border-border px-4">
      <Link className="flex items-center gap-2 font-semibold text-foreground transition-opacity duration-[var(--duration-ui)] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md" to="/dashboard">
        <div className="relative h-9 w-9 shrink-0">
          {showDefaultLogo ? (
            <Package2 className="h-9 w-9" />
          ) : (
            <img src={settings.systemLogo} alt="Logo" className="h-full w-full object-contain" />
          )}
        </div>
        <span className="">{settings.systemName}</span>
      </Link>
    </div>
  );
}
