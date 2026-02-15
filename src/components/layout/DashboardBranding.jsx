import { Link } from "react-router-dom";
import { Package2 } from "lucide-react";
import { useSystemSettings } from "@/context/SystemSettingsContext";

export function DashboardBranding() {
  const { settings } = useSystemSettings();
  const showDefaultLogo = !settings.systemLogo || settings.systemLogo === "/assets/logo.png";

  return (
    <div className="flex h-[60px] items-center border-b border-white/10 dark:border-white/5 px-4">
      <Link className="flex items-center gap-2 font-semibold text-foreground hover:opacity-90 transition-opacity" to="/dashboard">
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
