import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import type { Lang } from "@/lib/i18n";

export function LanguageToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="inline-flex rounded-md border overflow-hidden">
      <Button
        type="button" size="sm" variant={lang === "en" ? "default" : "ghost"}
        className={`rounded-none h-8 px-3 ${lang === "en" ? "bg-navy text-navy-foreground" : ""}`}
        onClick={() => onChange("en")}
      >
        <Languages className="size-3.5" />EN
      </Button>
      <Button
        type="button" size="sm" variant={lang === "ar" ? "default" : "ghost"}
        className={`rounded-none h-8 px-3 ${lang === "ar" ? "bg-navy text-navy-foreground" : ""}`}
        onClick={() => onChange("ar")}
      >
        ع AR
      </Button>
    </div>
  );
}
