import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, FileArchive, FileText } from "lucide-react";
import {
  useInvoices, useClients, usePayments,
  type Invoice, type DocStatus, type Currency, type ServiceType,
} from "@/lib/storage";
import { computeInvoiceTotals, formatDate, formatMoney } from "@/lib/format";
import { deriveInvoiceStatus, paymentsForInvoice } from "@/lib/account";
import { BulkInvoiceCard, BulkExportSummary, statusClass, statusLabel } from "@/components/doc/BulkInvoiceCard";
import { exportCombinedPdf, exportZip, type BulkSlide } from "@/lib/bulk-export";
import { LanguageToggle } from "@/components/doc/LanguageToggle";
import { tt, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/bulk-export")({
  head: () => ({ meta: [{ title: "Bulk Invoice Export — Elbakri Overseas" }] }),
  component: BulkExportPage,
});

const STATUS_OPTIONS: { value: DocStatus | "all" | "unpaid_all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "unpaid_all", label: "All unpaid (Unpaid + Partial + Overdue)" },
  { value: "Paid", label: "Paid" },
  { value: "Unpaid", label: "Unpaid" },
  { value: "Partial", label: "Partially Paid" },
  { value: "Overdue", label: "Overdue" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Draft", label: "Draft" },
];

const SERVICE_OPTIONS: { value: ServiceType | "all"; label: string }[] = [
  { value: "all", label: "All services" },
  { value: "hotel", label: "Hotel" }, { value: "tour", label: "Tour" },
  { value: "activity", label: "Activity" }, { value: "transfer", label: "Transfer" },
  { value: "flight", label: "Flight" }, { value: "visa", label: "Visa" },
  { value: "sim", label: "SIM" }, { value: "package", label: "Package" }, { value: "other", label: "Other" },
];

const CURRENCY_OPTIONS: Currency[] = ["EGP", "USD", "EUR", "SAR", "AED"];

function BulkExportPage() {
  const [invoices] = useInvoices();
  const [clients] = useClients();
  const [payments] = usePayments();
  const [lang, setLang] = useState<Lang>("en");
  const t = tt(lang);

  // Filters
  const [clientId, setClientId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [currency, setCurrency] = useState<string>("all");
  const [serviceType, setServiceType] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dueOnly, setDueOnly] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Off-screen render state during export
  const [stageInvoices, setStageInvoices] = useState<Invoice[]>([]);
  const [stageMode, setStageMode] = useState<"none" | "combined" | "zip">("none");
  const stageRef = useRef<HTMLDivElement>(null);

  // Compute filtered list
  const filtered = useMemo(() => {
    return invoices
      .map(inv => {
        const paid = paymentsForInvoice(inv.id, payments);
        const d = deriveInvoiceStatus(inv, paid);
        return { inv, ...d };
      })
      .filter(r => {
        const inv = r.inv;
        if (clientId !== "all" && inv.clientId !== clientId &&
            !(clients.find(c => c.id === clientId)?.name?.toLowerCase() === inv.client?.name?.toLowerCase())) return false;
        if (currency !== "all" && inv.currency !== currency) return false;
        if (serviceType !== "all" && !inv.items.some(it => it.type === serviceType)) return false;
        if (bookingRef && !(inv.bookingRef || "").toLowerCase().includes(bookingRef.toLowerCase())
            && !inv.items.some(it => (it.bookingRef || "").toLowerCase().includes(bookingRef.toLowerCase()))) return false;
        if (dateFrom && inv.date < dateFrom) return false;
        if (dateTo && inv.date > dateTo) return false;
        if (status === "unpaid_all") {
          if (!["Unpaid", "Partial", "Overdue"].includes(r.status)) return false;
        } else if (status !== "all" && r.status !== status) return false;
        if (dueOnly && r.remaining <= 0) return false;
        return true;
      })
      .sort((a, b) => (b.inv.date || "").localeCompare(a.inv.date || ""));
  }, [invoices, payments, clients, clientId, status, currency, serviceType, bookingRef, dateFrom, dateTo, dueOnly]);

  const allSelected = filtered.length > 0 && filtered.every(r => selected.has(r.inv.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(r => r.inv.id)));
  };
  const toggleOne = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const selectedInvoices: Invoice[] = useMemo(
    () => invoices.filter(i => selected.has(i.id)),
    [invoices, selected],
  );

  const totals = useMemo(() => {
    let total = 0, paid = 0, remaining = 0;
    for (const inv of selectedInvoices) {
      const fromP = paymentsForInvoice(inv.id, payments);
      const d = deriveInvoiceStatus(inv, fromP);
      if (inv.status !== "Cancelled") { total += d.grandTotal; remaining += d.remaining; }
      paid += d.paidAmount;
    }
    return { total, paid, remaining };
  }, [selectedInvoices, payments]);

  const fileLabel = (inv: Invoice) => {
    const fromP = paymentsForInvoice(inv.id, payments);
    const d = deriveInvoiceStatus(inv, fromP);
    const client = (inv.client?.name || "client").replace(/\s+/g, "-").replace(/[^\w\-]/g, "");
    return `ELBAKRI-INVOICE-${inv.number}-${client}-${d.status.toUpperCase()}`;
  };

  // Trigger export: render stage, wait for paint + images, then collect elements
  const runExport = async (mode: "combined" | "zip") => {
    if (selectedInvoices.length === 0) return;
    setStageMode(mode);
    setStageInvoices(selectedInvoices);
    // wait for React commit + browser paint + fonts
    await new Promise(r => requestAnimationFrame(() => r(null)));
    await new Promise(r => setTimeout(r, 250));
    try {
      await (document as any).fonts?.ready;
    } catch {}
    const root = stageRef.current;
    if (!root) { setStageMode("none"); setStageInvoices([]); return; }

    const slides: BulkSlide[] = [];

    if (mode === "combined") {
      const summary = root.querySelector<HTMLElement>("[data-stage-summary]");
      if (summary) slides.push({ element: summary, filename: "summary" });
    }
    const cards = root.querySelectorAll<HTMLElement>("[data-stage-card]");
    cards.forEach((el, idx) => {
      const inv = selectedInvoices[idx];
      slides.push({ element: el, filename: fileLabel(inv) });
    });

    const stamp = new Date().toISOString().slice(0, 10);
    if (mode === "combined") {
      await exportCombinedPdf(slides, `ELBAKRI-Bulk-Invoices-${stamp}.pdf`);
    } else {
      await exportZip(slides, `ELBAKRI-Bulk-Invoices-${stamp}.zip`);
    }

    setStageMode("none");
    setStageInvoices([]);
  };

  // Quick-action helpers
  const setStatusAndSelectAll = (s: string) => {
    setStatus(s);
    // selection will be done after filter recomputes; use a tick
    setTimeout(() => {
      setSelected(new Set(
        invoices.filter(inv => {
          const r = deriveInvoiceStatus(inv, paymentsForInvoice(inv.id, payments));
          if (s === "unpaid_all") return ["Unpaid", "Partial", "Overdue"].includes(r.status);
          return r.status === s;
        }).map(i => i.id),
      ));
    }, 0);
  };

  const onlyClient = clientId !== "all" ? clients.find(c => c.id === clientId) : undefined;

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.bulkExport}</h1>
          <p className="text-sm text-muted-foreground">Select invoices, then download as a combined PDF or a ZIP of individual PDFs.</p>
        </div>
        <LanguageToggle lang={lang} onChange={setLang} />
      </header>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 grid gap-3 md:grid-cols-3 lg:grid-cols-4">
          <div>
            <Label className="text-xs">Client / agency</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allClients}</SelectItem>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name || "—"}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t.invoiceStatusLabel}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t.currency}</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allCurrencies}</SelectItem>
                {CURRENCY_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t.serviceTypeLabel}</Label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SERVICE_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t.dateFrom}</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">{t.dateTo}</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">{t.bookingRef}</Label>
            <Input value={bookingRef} onChange={e => setBookingRef(e.target.value)} placeholder="ref…" />
          </div>
          <div className="flex items-end gap-2">
            <Checkbox id="dueOnly" checked={dueOnly} onCheckedChange={v => setDueOnly(Boolean(v))} />
            <label htmlFor="dueOnly" className="text-sm">Outstanding balance only</label>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={toggleAll}>
          {allSelected ? t.clearSelection : t.selectAll} ({filtered.length})
        </Button>
        <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>{t.clearSelection}</Button>
        <Button size="sm" variant="outline" onClick={() => setStatusAndSelectAll("unpaid_all")}>Export Unpaid Only</Button>
        <Button size="sm" variant="outline" onClick={() => setStatusAndSelectAll("Paid")}>Export Paid Only</Button>
        <Button size="sm" variant="outline" onClick={() => setStatusAndSelectAll("Cancelled")}>Export Cancelled Only</Button>
        {onlyClient && (
          <Button size="sm" variant="outline" onClick={() => {
            setSelected(new Set(invoices.filter(i => i.clientId === onlyClient.id || i.client?.name === onlyClient.name).map(i => i.id)));
          }}>Export All {onlyClient.name} Invoices</Button>
        )}
        {onlyClient && (
          <Button size="sm" variant="outline" onClick={() => {
            setSelected(new Set(invoices.filter(i => {
              if (i.clientId !== onlyClient.id && i.client?.name !== onlyClient.name) return false;
              const d = deriveInvoiceStatus(i, paymentsForInvoice(i.id, payments));
              return d.remaining > 0 && i.status !== "Cancelled";
            }).map(i => i.id)));
          }}>Export {onlyClient.name} Outstanding</Button>
        )}
      </div>

      {/* Totals + export buttons */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <span className="font-semibold">{selected.size}</span> {t.selectedInvoices} ·
            <span className="ml-2">{t.totalAmount}: <strong>{formatMoney(totals.total, (selectedInvoices[0]?.currency as Currency) || "USD")}</strong></span>
            <span className="ml-2 text-green-700">{t.paidAmount}: <strong>{formatMoney(totals.paid, (selectedInvoices[0]?.currency as Currency) || "USD")}</strong></span>
            <span className="ml-2 text-red-700">{t.remainingAmount}: <strong>{formatMoney(totals.remaining, (selectedInvoices[0]?.currency as Currency) || "USD")}</strong></span>
          </div>
          <div className="flex gap-2">
            <Button disabled={selected.size === 0 || stageMode !== "none"} onClick={() => runExport("combined")}>
              <FileText className="size-4 mr-1" /> {t.combinedPdf}
            </Button>
            <Button disabled={selected.size === 0 || stageMode !== "none"} variant="secondary" onClick={() => runExport("zip")}>
              <FileArchive className="size-4 mr-1" /> {t.zipFile}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice list */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-[40px_1fr_1fr_120px_120px_120px_100px] gap-2 px-3 py-2 border-b text-[11px] uppercase tracking-wide text-muted-foreground">
            <div></div><div>Invoice</div><div>Client</div>
            <div className="text-right">{t.totalAmount}</div>
            <div className="text-right">{t.paidAmount}</div>
            <div className="text-right">{t.remainingAmount}</div>
            <div>Status</div>
          </div>
          {filtered.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">No invoices match the filters.</div>}
          {filtered.map(({ inv, status: st, grandTotal, paidAmount, remaining, daysOverdue }) => (
            <label key={inv.id} className="grid grid-cols-[40px_1fr_1fr_120px_120px_120px_100px] gap-2 px-3 py-2 border-b items-center hover:bg-muted cursor-pointer">
              <Checkbox checked={selected.has(inv.id)} onCheckedChange={() => toggleOne(inv.id)} />
              <div className="min-w-0">
                <div className="font-semibold doc-navy">{inv.number}</div>
                <div className="text-[11px] text-muted-foreground">{formatDate(inv.date)} {inv.bookingRef && `· ${inv.bookingRef}`}</div>
              </div>
              <div className="truncate">{inv.client?.name || "—"}</div>
              <div className="text-right text-sm">{formatMoney(grandTotal, inv.currency)}</div>
              <div className="text-right text-sm text-green-700">{formatMoney(paidAmount, inv.currency)}</div>
              <div className="text-right text-sm font-semibold" style={{ color: remaining > 0 ? "#8a1414" : "#146c2e" }}>{formatMoney(remaining, inv.currency)}</div>
              <div>
                <Badge className={statusClass(st)} variant="outline">
                  {statusLabel(st, lang)}
                  {st === "Overdue" && daysOverdue > 0 && ` · ${daysOverdue}d`}
                </Badge>
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Off-screen stage used during export */}
      {stageMode !== "none" && (
        <div ref={stageRef} className="bulk-export-stage" aria-hidden>
          {stageMode === "combined" && (
            <div data-stage-summary>
              <BulkExportSummary
                invoices={stageInvoices}
                payments={payments}
                lang={lang}
                clientName={onlyClient?.name}
                dateFrom={dateFrom}
                dateTo={dateTo}
              />
            </div>
          )}
          {stageInvoices.map(inv => (
            <div data-stage-card key={inv.id}>
              <BulkInvoiceCard invoice={inv} payments={payments} lang={lang} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
