import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function LanguageSwitch() {
  const { i18n, t } = useTranslation();

  useEffect(() => {
    const dir = i18n.language === "ar" ? "rtl" : "ltr";
    const lang = i18n.language === "ar" ? "ar" : "en";
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [i18n.language]);

  const toggle = () => {
    const next = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", next);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggle}
      className={cn("min-w-[3rem] font-medium")}
      aria-label={i18n.language === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      {i18n.language === "ar" ? "EN" : "ع"}
    </Button>
  );
}
