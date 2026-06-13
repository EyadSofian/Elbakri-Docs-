import { useMemo, useRef, useState } from "react";
import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, Printer } from "lucide-react";
import {
  useClients, useInvoices, usePayments, useCreditNotes, useDebitNotes,
  useRefunds, useAdjustments, type Currency, type Client,
} from "@/lib/storage";
import { computeClientAccount } from "@/lib/account";
import { ConsolidatedClientInvoicePreview, type ConsolidatedFilters } from "@/components/account/ConsolidatedClientInvoicePreview";
import { LanguageToggle } from "@/components/doc/LanguageToggle";
import { exportElementToPdf, printElement, sanitizeFilenamePart } from "@/lib/pdf";
import type { Lang } from "@/lib/i18n";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/accounts/$id/consolidated")({
  head: () => ({ meta: [{ title: "Consolidated Client Invoice — Elbakri Overseas" }] }),
  component: ConsolidatedPage,
});

const CURRENCIES: Currency[] = ["USD", "EUR", "EGP", "SAR", "AED"];

function ConsolidatedPage() {
  const { id } = useParams({ from: "/accounts/$id/consolidated" });
  const [clients] = useClients();
  const client = clients.find(c => c.id === id);
  if (!client) {
    return (
      <div className="p-10 text-center space-y-3">
        <div className="text-sm text-muted-foreground">
          {clients.length === 0 ? "Loading account…" : "Client not found."}
        </div>
        <Link to="/accounts" className="text-sm underline doc-navy">Back to client accounts</Link>
      </div>
    );
  }
  return <ConsolidatedView key={client.id} client={client} />;
}

function ConsolidatedView({ client }: { client: Client }) {
  const id = client.id;
  const [invoices] = useInvoices();
  const [payments] = usePayments();
  const [creditNotes] = useCreditNotes();
  const [debitNotes] = useDebitNotes();
  const [refunds] = useRefunds();
  const [adjustments] = useAdjustments();

  const [currency, setCurrency] = useState<Currency>(() => {
    const first = invoices.find(i => i.clientId === id);
    return (first?.currency as Currency) || "USD";
  });
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [includePaid, setIncludePaid] = useState(false);
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [includePaymentHistory, setIncludePaymentHistory] = useState(true);
  const [includeCreditNotes, setIncludeCreditNotes] = useState(true);
  const [includePreviousBalance, setIncludePreviousBalance] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [manualSelect, setManualSelect] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [preparedBy, setPreparedBy] = useState("");
  const [accountNumber, setAccountNumber] = useState(client.id.slice(0, 8).toUpperCase());
  const [dueDate, setDueDate] = useState("");

  const account = useMemo(
    () => computeClientAccount({ client, invoices, payments, creditNotes, debitNotes, refunds, adjustments, currency }),
    [client, invoices, payments, creditNotes, debitNotes, refunds, adjustments, currency],
  );

  const filters: ConsolidatedFilters = {
    periodFrom, periodTo,
    includePaid, includeCancelled, includePaymentHistory, includeCreditNotes, includePreviousBalance,
    selectedIds: manualSelect && selectedIds.size > 0 ? Array.from(selectedIds) : undefined,
  };

  const docRef = useRef<HTMLDivElement>(null);
  const downloadPdf = async () => {
    if (!docRef.current) return;
    const name = `ELBAKRI-CONSOLIDATED-${sanitizeFilenamePart(client.name)}_${new Date().toISOString().slice(0,10)}`;
    await exportElementToPdf(docRef.current, name, "portrait");
  };
  const print = () => { if (docRef.current) printElement(docRef.current); };

  return (
    <div className="flex flex-col xl:flex-row min-h-[calc(100vh-3.5rem)]">
      <aside className="xl:w-[380px] xl:border-r p-4 space-y-3 overflow-y-auto print:hidden">
        <Link to="/accounts/$id" params={{ id }} className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:underline">
          <ArrowLeft className="size-3.5" /> Back to {client.name}
        </Link>
        <h1 className="text-xl font-bold doc-navy">Consolidated Client Invoice</h1>
        <p className="text-xs text-muted-foreground">Build a clean invoice-style PDF summarising the client's account.</p>

        <div className="grid grid-cols-2 gap-2">
          <F label="Currency">
            <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </F>
          <F label="Language">
            <LanguageToggle lang={lang} onChange={setLang} />
          </F>
          <F label="Period from"><Input type="date" value={periodFrom} onChange={e => setPeriodFrom(e.target.value)} /></F>
          <F label="Period to"><Input type="date" value={periodTo} onChange={e => setPeriodTo(e.target.value)} /></F>
          <F label="Account #"><Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} /></F>
          <F label="Due date"><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></F>
          <F label="Prepared by" className="col-span-2"><Input value={preparedBy} onChange={e => setPreparedBy(e.target.value)} /></F>
        </div>

        <Card><CardContent className="pt-3 space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Include</div>
          <Toggle l="Paid invoices" v={includePaid} onChange={setIncludePaid} />
          <Toggle l="Cancelled invoices" v={includeCancelled} onChange={setIncludeCancelled} />
          <Toggle l="Payment history" v={includePaymentHistory} onChange={setIncludePaymentHistory} />
          <Toggle l="Credit notes" v={includeCreditNotes} onChange={setIncludeCreditNotes} />
          <Toggle l="Previous balance (opening)" v={includePreviousBalance} onChange={setIncludePreviousBalance} />
          <Toggle l="Select invoices manually" v={manualSelect} onChange={setManualSelect} />
        </CardContent></Card>

        {manualSelect && (
          <Card><CardContent className="p-0 max-h-72 overflow-y-auto divide-y">
            {account.invoices.length === 0 && <div className="p-4 text-xs text-muted-foreground text-center">No invoices.</div>}
            {account.invoices.map(r => (
              <label key={r.invoice.id} className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-muted/40">
                <Checkbox
                  checked={selectedIds.has(r.invoice.id)}
                  onCheckedChange={(c) => {
                    const s = new Set(selectedIds);
                    if (c) s.add(r.invoice.id); else s.delete(r.invoice.id);
                    setSelectedIds(s);
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold doc-navy">{r.invoice.number}</div>
                  <div className="text-[10px] text-muted-foreground">{r.effectiveStatus} · {formatMoney(r.remaining, currency)} due</div>
                </div>
              </label>
            ))}
          </CardContent></Card>
        )}

        <div className="flex gap-2 pt-1">
          <Button onClick={downloadPdf} className="bg-navy text-navy-foreground flex-1"><Download />PDF</Button>
          <Button onClick={print} variant="outline"><Printer />Print</Button>
        </div>
      </aside>

      <section className="flex-1 bg-muted/30 overflow-y-auto p-6 flex justify-center">
        <div ref={docRef}>
          <ConsolidatedClientInvoicePreview
            client={client}
            account={account}
            filters={filters}
            number={`CONS-${accountNumber}-${new Date().toISOString().slice(0,10)}`}
            lang={lang}
            preparedBy={preparedBy}
            accountNumber={accountNumber}
            dueDate={dueDate}
          />
        </div>
      </section>
    </div>
  );
}

function F({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1 ${className}`}><Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>{children}</div>;
}
function Toggle({ l, v, onChange }: { l: string; v: boolean; onChange: (b: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs cursor-pointer">
      <Checkbox checked={v} onCheckedChange={(c) => onChange(!!c)} />
      <span>{l}</span>
    </label>
  );
}
