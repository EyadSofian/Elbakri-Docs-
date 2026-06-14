import { getSettings } from "@/lib/storage";
import type { CompanySettings } from "@/lib/storage";
import { tt, type Lang } from "@/lib/i18n";

const logoUrl = "/elbakri-logo.png";

export function DocHeader({
  title,
  subtitle,
  number,
  date,
  status,
  settings,
  lang = "en",
}: {
  title: string;
  subtitle?: string;
  number?: string;
  date?: string;
  status?: string;
  settings?: CompanySettings;
  lang?: Lang;
}) {
  const s = settings ?? getSettings();
  const t = tt(lang);
  return (
    <>
      <header className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <img
            src={logoUrl}
            alt="Elbakri Overseas"
            crossOrigin="anonymous"
            className="h-16 w-16 object-contain"
          />
          <div>
            <div className="text-[18px] font-bold doc-navy tracking-tight leading-none">
              {s.name}
            </div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-amber-700 mt-1">
              EST. {s.established} · {s.tagline}
            </div>
            <div className="text-[10px] text-neutral-600 mt-2 leading-tight">
              {s.address}
              {s.address && " · "}
              {s.phone}
              <br />
              {s.email}
              {s.website && " · "}
              {s.website}
              {s.taxId && (
                <>
                  <br />
                  Tax ID: {s.taxId}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[22px] font-bold doc-navy tracking-tight">{title}</div>
          {subtitle && (
            <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              {subtitle}
            </div>
          )}
          {number && (
            <div className="mt-2 text-[11px]">
              <span className="text-neutral-500">{t.no} </span>
              <span className="font-semibold doc-navy">{number}</span>
            </div>
          )}
          {date && (
            <div className="text-[11px]">
              <span className="text-neutral-500">{t.date} </span>
              <span className="font-medium">{date}</span>
            </div>
          )}
          {status && (
            <div className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider doc-gold-bg">
              {status}
            </div>
          )}
        </div>
      </header>
      <hr className="doc-divider my-4" />
    </>
  );
}

export function DocFooter({ lang = "en", extra }: { lang?: Lang; extra?: string }) {
  const s = getSettings();
  const t = tt(lang);
  return (
    <footer className="mt-8 pt-3 border-t text-[10px] text-neutral-500">
      {extra && <div className="mb-2 doc-navy font-semibold text-[10.5px]">{extra}</div>}
      <div className="flex items-center justify-between">
        <div>
          <div className="doc-navy font-semibold">{t.thankYou(s.name, s.established)}</div>
          <div>{t.computerGenerated}</div>
        </div>
        <div className="text-right">
          <div>{s.website || s.email}</div>
          <div>{s.phone}</div>
        </div>
      </div>
    </footer>
  );
}
