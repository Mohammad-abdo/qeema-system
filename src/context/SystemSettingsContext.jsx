import { createContext, useContext, useEffect, useState } from "react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const defaultSettings = {
  systemName: "Qeema Tech Management",
  systemLogo: "/assets/logo.png",
  allowRegistration: true,
};

const SystemSettingsContext = createContext({
  settings: defaultSettings,
  isLoading: true,
  refreshSettings: async () => {},
});

export function SystemSettingsProvider({ children }) {
  const { token } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      // Public branding (login page, sidebar) – no auth
      const brandingRes = await api.get("/api/v1/settings/branding").catch(() => null);
      if (brandingRes?.data) {
        setSettings((prev) => ({
          ...prev,
          systemName: brandingRes.data.systemName ?? defaultSettings.systemName,
          systemLogo: brandingRes.data.systemLogo ?? defaultSettings.systemLogo,
        }));
      }
      if (token) {
        const res = await api.get("/api/v1/settings/system?key=general").catch(() => null);
        if (res?.data?.value) {
          try {
            const parsed = JSON.parse(res.data.value);
            setSettings((prev) => ({
              ...prev,
              systemName: parsed.systemName ?? defaultSettings.systemName,
              systemLogo: parsed.systemLogo ?? defaultSettings.systemLogo,
              allowRegistration: parsed.allowRegistration ?? defaultSettings.allowRegistration,
            }));
          } catch (_) {}
        }
      }
    } catch (_) {}
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  return (
    <SystemSettingsContext.Provider value={{ settings, isLoading, refreshSettings: fetchSettings }}>
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettings() {
  return useContext(SystemSettingsContext);
}
