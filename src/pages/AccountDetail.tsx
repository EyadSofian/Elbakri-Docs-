import { useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  FileText,
  Plus,
  Printer,
  Receipt,
  Wallet,
  ArrowLeft,
  FileSpreadsheet,
  MinusCircle,
  PlusCircle,
  RotateCcw,
  Settings2,
  BookOpen,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useClients,
  useInvoices,
  usePayments,
  useCreditNotes,
  useDebitNotes,
  useRefunds,
  useAdjustments,
  PAYMENT_METHODS,
  type Currency,
  type DocStatus,
  type Client,
} from "@/lib/storage";
import { computeClientAccount, buildLedger } from "@/lib/account";
import { formatDate, formatMoney } from "@/lib/format";
import { PaymentDialog } from "@/components/account/PaymentDialog";
import { CreditNoteDialog } from "@/components/account/CreditNoteDialog";
import { DebitNoteDialog } from "@/components/account/DebitNoteDialog";
import { RefundDialog } from "@/components/account/RefundDialog";
import { AdjustmentDialog } from "@/components/account/AdjustmentDialog";
import { OpeningBalanceDialog } from "@/components/account/OpeningBalanceDialog";
import { ConsolidatedInvoicePreview } from "@/components/account/ConsolidatedInvoicePreview";
import { ClientAccountStatementPreview } from "@/components/account/ClientAccountStatementPreview";
import { LanguageToggle } from "@/components/doc/LanguageToggle";
import { exportElementToPdf, printElement, sanitizeFilenamePart } from "@/lib/pdf";
import type { Lang } from "@/lib/i18n";
import { useDocumentTitle } from "@/lib/use-document-title";

const STATUS_OPTIONS: (DocStatus | "All")[] = [
  "All",
  "Draft",
  "Unpaid",
  "Partial",
  "Paid",
  "Overdue",
  "Cancelled",
];
const CURRENCY_OPTIONS: Currency[] = ["USD", "EUR", "EGP", "SAR", "AED"];

export default function ClientAccountPage() {
  useDocumentTitle("Client Account — Elbakri Overseas");
  const { id } = useParams();
  const [clients] = useClients();
  const client = clients.find((c) => c.id === id);

  // NOTE: all stateful hooks live in ClientAccountView so that hook order is
  // never affected by whether the client exists. Returning before hooks (the
  // previous behaviour) crashed React with "rendered more hooks than during the
  // previous render" once the async client list loaded.
  if (!client) {
    return (
      <div className="p-10 text-center space-y-3">
        <div className="text-sm text-muted-foreground">
          {clients.length === 0 ? "Loading account…" : "Client not found."}
        </div>
        <Link to="/accounts" className="text-sm underline doc-navy">
          Back to client accounts
        </Link>
      </div>
    );
  }
  return <ClientAccountView key={client.id} client={client} />;
}

function ClientAccountView({ client }: { client: Client }) {
  const id = client.id;
  const [invoices, setInvoices] = useInvoices();
  const [payments, setPayments] = usePayments();
  const [creditNotes, setCreditNotes] = useCreditNotes();
  const [debitNotes, setDebitNotes] = useDebitNotes();
  const [refunds, setRefunds] = useRefunds();
  const [adjustments, setAdjustments] = useAdjustments();

  const [currency, setCurrency] = useState<Currency>(() => {
    if (client.currency) return client.currency;
    const first = invoices.find(
      (i) => i.clientId === id || i.client.name?.toLowerCase() === client.name.toLowerCase(),
    );
    return (first?.currency as Currency) || "USD";
  });
  const [periodFrom, setPeriodFrom] = useState<string>("");
  const [periodTo, setPeriodTo] = useState<string>("");
  const [status, setStatus] = useState<DocStatus | "All">("All");
  const [preparedBy, setPreparedBy] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>(
    client.accountNumber || client.id.slice(0, 8).toUpperCase(),
  );

  const account = useMemo(
    () =>
      computeClientAccount({
        client,
        invoices,
        payments,
        creditNotes,
        debitNotes,
        refunds,
        adjustments,
        currency,
      }),
    [client, invoices, payments, creditNotes, debitNotes, refunds, adjustments, currency],
  );

  const ledger = useMemo(() => buildLedger(account), [account]);

  const filteredInvoices = useMemo(
    () =>
      account.invoices.filter((r) => {
        if (status !== "All" && r.effectiveStatus !== status) return false;
        if (periodFrom && r.invoice.date < periodFrom) return false;
        if (periodTo && r.invoice.date > periodTo) return false;
        return true;
      }),
    [account.invoices, status, periodFrom, periodTo],
  );

  const [payOpen, setPayOpen] = useState(false);
  const [cnOpen, setCnOpen] = useState(false);
  const [dnOpen, setDnOpen] = useState(false);
  const [rfOpen, setRfOpen] = useState(false);
  const [adjOpen, setAdjOpen] = useState(false);
  const [obOpen, setObOpen] = useState(false);
  const [presetInv, setPresetInv] = useState<string | undefined>();
  const [presetCnInv, setPresetCnInv] = useState<string | undefined>();
  const [lang, setLang] = useState<Lang>("en");

  const consolidatedRef = useRef<HTMLDivElement>(null);
  const statementRef = useRef<HTMLDivElement>(null);

  const downloadConsolidated = async () => {
    if (!consolidatedRef.current) return;
    const name = `ELBAKRI-CONSOLIDATED-${sanitizeFilenamePart(client.name)}`;
    await exportElementToPdf(consolidatedRef.current, name, "portrait");
  };
  const downloadStatement = async () => {
    if (!statementRef.current) return;
    const name = `ELBAKRI-STATEMENT-${sanitizeFilenamePart(client.name)}`;
    await exportElementToPdf(statementRef.current, name, "landscape");
  };
  const exportCsv = () => {
    const rows = [
      ["Date", "Type", "Number", "Description", "Debit", "Credit", "Balance"],
      ...ledger.map((r) => [r.date, r.type, r.number, r.description, r.debit, r.credit, r.balance]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ELBAKRI-ledger-${sanitizeFilenamePart(client.name)}.csv`;
    a.click();
    toast.success("CSV downloaded");
  };

  const removePayment = (pid: string) => {
    if (!confirm("Delete this payment?")) return;
    setPayments((prev) => prev.filter((p) => p.id !== pid));
  };
  const removeCredit = (cid: string) => {
    if (!confirm("Delete this credit note?")) return;
    setCreditNotes((prev) => prev.filter((c) => c.id !== cid));
  };
  const removeDebit = (did: string) => {
    if (!confirm("Delete this debit note?")) return;
    setDebitNotes((prev) => prev.filter((d) => d.id !== did));
  };
  const removeRefund = (rid: string) => {
    if (!confirm("Delete this refund?")) return;
    setRefunds((prev) => prev.filter((r) => r.id !== rid));
  };
  const removeAdj = (aid: string) => {
    if (!confirm("Delete this adjustment?")) return;
    setAdjustments((prev) => prev.filter((a) => a.id !== aid));
  };
  const cancelInvoice = (iid: string) => {
    if (!confirm("Cancel this invoice? It will be removed from outstanding balances.")) return;
    setInvoices((prev) =>
      prev.map((i) => (i.id === iid ? { ...i, status: "Cancelled" as DocStatus } : i)),
    );
    toast.success("Invoice cancelled");
  };

  return (
    <div className="flex flex-col xl:flex-row min-h-[calc(100vh-3.5rem)]">
      <section className="editor-pane xl:w-[680px] xl:border-r p-4 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/accounts"
            className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="size-3.5" /> All accounts
          </Link>
          <Badge variant="outline">{account.totals.invoiceCount} invoices</Badge>
        </div>

        <header>
          <h1 className="text-2xl font-bold doc-navy">{client.name}</h1>
          <div className="text-xs text-muted-foreground">
            {[
              client.type === "individual" ? "Individual" : "Company / B2B",
              client.contactPerson,
              client.email,
              client.phone,
              client.taxId && `Tax ${client.taxId}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </header>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Currency">
            <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Period from">
            <Input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} />
          </Field>
          <Field label="Period to">
            <Input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} />
          </Field>
          <Field label="Status">
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Account #">
            <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
          </Field>
          <Field label="Prepared by">
            <Input value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} />
          </Field>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setPresetInv(undefined);
              setPayOpen(true);
            }}
            className="bg-navy text-navy-foreground"
            size="sm"
          >
            <Wallet />
            Payment
          </Button>
          <Button
            onClick={() => {
              setPresetCnInv(undefined);
              setCnOpen(true);
            }}
            variant="outline"
            size="sm"
          >
            <MinusCircle />
            Credit Note
          </Button>
          <Button onClick={() => setDnOpen(true)} variant="outline" size="sm">
            <PlusCircle />
            Debit Note
          </Button>
          <Button onClick={() => setRfOpen(true)} variant="outline" size="sm">
            <RotateCcw />
            Refund
          </Button>
          <Button onClick={() => setAdjOpen(true)} variant="outline" size="sm">
            <Settings2 />
            Adjustment
          </Button>
          <Button onClick={() => setObOpen(true)} variant="outline" size="sm">
            <BookOpen />
            Opening
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/invoices/new">
              <Plus />
              Invoice
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={`/accounts/${id}/consolidated`}>
              <Receipt />
              Consolidated Invoice
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <FileSpreadsheet />
            Ledger CSV
          </Button>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-6 w-full text-xs">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="notes">CN/DN</TabsTrigger>
            <TabsTrigger value="ledger">Ledger</TabsTrigger>
            <TabsTrigger value="aging">Aging</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <KPI
                label="Total Invoiced"
                value={formatMoney(account.totals.totalInvoiced, currency)}
              />
              <KPI label="Total Paid" value={formatMoney(account.totals.totalPaid, currency)} />
              <KPI
                label="Total Credit Notes"
                value={formatMoney(account.totals.totalCreditNotes, currency)}
              />
              <KPI
                label="Total Debit Notes"
                value={formatMoney(account.totals.totalDebitNotes, currency)}
              />
              <KPI
                label="Outstanding"
                value={formatMoney(account.totals.totalOutstanding, currency)}
                highlight
              />
              <KPI
                label="Overdue"
                value={formatMoney(account.totals.totalOverdue, currency)}
                tone="warn"
              />
              <KPI
                label="Credit Balance"
                value={formatMoney(account.totals.creditBalance, currency)}
              />
              <KPI
                label="Running Balance"
                value={`${formatMoney(Math.abs(account.totals.runningBalance), currency)} ${account.totals.runningBalance >= 0 ? "Dr" : "Cr"}`}
              />
              <KPI label="Opening" value={formatMoney(account.totals.openingBalance, currency)} />
              <KPI
                label="Refunds / Adj."
                value={formatMoney(
                  account.totals.totalRefunds +
                    account.totals.totalAdjDebit -
                    account.totals.totalAdjCredit,
                  currency,
                )}
              />
              <KPI
                label="Last Invoice"
                value={account.lastInvoiceDate ? formatDate(account.lastInvoiceDate) : "—"}
              />
              <KPI
                label="Last Payment"
                value={account.lastPaymentDate ? formatDate(account.lastPaymentDate) : "—"}
              />
            </div>
            <Card>
              <CardContent className="pt-4">
                <div className="text-xs font-semibold mb-2 doc-navy">Invoice mix</div>
                <div className="text-xs grid grid-cols-2 gap-1">
                  <span>Fully paid invoices</span>
                  <span className="text-right">{account.totals.paidCount}</span>
                  <span>Partial invoices</span>
                  <span className="text-right">{account.totals.partialCount}</span>
                  <span>Unpaid / overdue</span>
                  <span className="text-right">{account.totals.unpaidCount}</span>
                  <span>Overdue</span>
                  <span className="text-right text-destructive">{account.totals.overdueCount}</span>
                  <span>Cancelled</span>
                  <span className="text-right text-muted-foreground">
                    {account.totals.cancelledCount}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <Card>
              <CardContent className="p-0 divide-y">
                {filteredInvoices.length === 0 && (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No invoices match filters.
                  </div>
                )}
                {filteredInvoices.map((r) => (
                  <div
                    key={r.invoice.id}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50"
                  >
                    <Link to={`/invoices/${r.invoice.id}`} className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold doc-navy">{r.invoice.number}</span>
                        <Badge
                          variant={
                            r.effectiveStatus === "Paid"
                              ? "default"
                              : r.effectiveStatus === "Overdue"
                                ? "destructive"
                                : r.invoice.status === "Cancelled"
                                  ? "secondary"
                                  : "outline"
                          }
                        >
                          {r.effectiveStatus}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(r.invoice.date)} · due {formatDate(r.invoice.dueDate)}
                        {r.daysOverdue > 0 ? ` · ${r.daysOverdue}d late` : ""}
                      </div>
                    </Link>
                    <div className="text-right text-xs">
                      <div>{formatMoney(r.grandTotal, currency)}</div>
                      <div className="text-[10px] text-muted-foreground">
                        paid {formatMoney(r.paidAmount, currency)}
                        {r.creditApplied > 0
                          ? ` · CN ${formatMoney(r.creditApplied, currency)}`
                          : ""}
                      </div>
                      <div className="font-semibold doc-navy">
                        {formatMoney(r.remaining, currency)} due
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {r.remaining > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPresetInv(r.invoice.id);
                            setPayOpen(true);
                          }}
                        >
                          Pay
                        </Button>
                      )}
                      {r.remaining > 0 && r.paidAmount > 0 && (
                        <Button asChild size="sm" variant="ghost" title="Balance Due Invoice">
                          <Link to={`/invoices/${r.invoice.id}/balance-due`}>Bal. Due</Link>
                        </Button>
                      )}
                      {r.remaining > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setPresetCnInv(r.invoice.id);
                            setCnOpen(true);
                          }}
                        >
                          CN
                        </Button>
                      )}
                      {r.invoice.status !== "Cancelled" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => cancelInvoice(r.invoice.id)}
                        >
                          <X className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardContent className="p-0 divide-y">
                {account.payments.length === 0 && (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No payments recorded.
                  </div>
                )}
                {account.payments.map((p) => {
                  const m = PAYMENT_METHODS.find((x) => x.value === p.method);
                  const allocated = p.allocations.reduce((s, a) => s + a.amount, 0);
                  return (
                    <div key={p.id} className="px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold doc-navy">
                            {p.number}{" "}
                            <span className="text-xs text-muted-foreground">
                              · {formatDate(p.date)} · {m?.label}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {p.allocations.length} allocation(s)
                            {p.reference && ` · ref ${p.reference}`}
                            {p.amount - allocated > 0.01 && (
                              <>
                                {" "}
                                ·{" "}
                                <span className="text-emerald-700">
                                  credit {formatMoney(p.amount - allocated, currency)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right font-bold doc-navy">
                          {formatMoney(p.amount, currency)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => removePayment(p.id)}
                        >
                          Delete
                        </Button>
                      </div>
                      {p.allocations.length > 0 && (
                        <div className="ml-2 mt-1 text-[10px] text-muted-foreground space-y-0.5">
                          {p.allocations.map((a) => {
                            const inv = account.invoices.find(
                              (r) => r.invoice.id === a.invoiceId,
                            )?.invoice;
                            return (
                              <div key={a.invoiceId}>
                                → {inv?.number || a.invoiceId.slice(0, 6)} ·{" "}
                                {formatMoney(a.amount, currency)}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-3">
            <Card>
              <CardContent className="p-0 divide-y">
                <div className="px-3 py-2 text-[11px] uppercase tracking-wider bg-muted/50">
                  Credit Notes
                </div>
                {account.creditNotes.length === 0 && (
                  <div className="p-3 text-xs text-muted-foreground text-center">None.</div>
                )}
                {account.creditNotes.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold doc-navy">
                        {c.number}{" "}
                        <span className="text-xs text-muted-foreground">
                          · {formatDate(c.date)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {String(c.reason).replace(/_/g, " ")}
                        {c.invoiceId
                          ? ` · vs ${account.invoices.find((r) => r.invoice.id === c.invoiceId)?.invoice.number || ""}`
                          : ""}
                      </div>
                    </div>
                    <div className="text-right font-bold text-emerald-700">
                      −{formatMoney(c.amount, currency)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => removeCredit(c.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
                <div className="px-3 py-2 text-[11px] uppercase tracking-wider bg-muted/50">
                  Debit Notes
                </div>
                {account.debitNotes.length === 0 && (
                  <div className="p-3 text-xs text-muted-foreground text-center">None.</div>
                )}
                {account.debitNotes.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold doc-navy">
                        {d.number}{" "}
                        <span className="text-xs text-muted-foreground">
                          · {formatDate(d.date)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {String(d.reason).replace(/_/g, " ")}
                      </div>
                    </div>
                    <div className="text-right font-bold text-destructive">
                      +{formatMoney(d.amount, currency)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => removeDebit(d.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
                <div className="px-3 py-2 text-[11px] uppercase tracking-wider bg-muted/50">
                  Refunds
                </div>
                {account.refunds.length === 0 && (
                  <div className="p-3 text-xs text-muted-foreground text-center">None.</div>
                )}
                {account.refunds.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold doc-navy">
                        {r.number}{" "}
                        <span className="text-xs text-muted-foreground">
                          · {formatDate(r.date)} · {r.method.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <div className="text-right font-bold">{formatMoney(r.amount, currency)}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => removeRefund(r.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
                <div className="px-3 py-2 text-[11px] uppercase tracking-wider bg-muted/50">
                  Adjustments
                </div>
                {account.adjustments.length === 0 && (
                  <div className="p-3 text-xs text-muted-foreground text-center">None.</div>
                )}
                {account.adjustments.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold doc-navy">
                        {a.number}{" "}
                        <span className="text-xs text-muted-foreground">
                          · {formatDate(a.date)} · {a.direction}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">{a.reason}</div>
                    </div>
                    <div
                      className={`text-right font-bold ${a.direction === "debit" ? "text-destructive" : "text-emerald-700"}`}
                    >
                      {a.direction === "debit" ? "+" : "−"}
                      {formatMoney(a.amount, currency)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => removeAdj(a.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ledger">
            <Card>
              <CardContent className="p-0">
                <div className="max-h-[60vh] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                      <tr className="text-left">
                        <th className="p-2">Date</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">No.</th>
                        <th className="p-2">Description</th>
                        <th className="p-2 text-right">Debit</th>
                        <th className="p-2 text-right">Credit</th>
                        <th className="p-2 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((r) => (
                        <tr key={r.id} className="border-t">
                          <td className="p-2">{r.type === "opening" ? "—" : formatDate(r.date)}</td>
                          <td className="p-2 capitalize text-[10px]">{r.type.replace("_", " ")}</td>
                          <td className="p-2 font-medium">{r.number}</td>
                          <td className="p-2 text-[10.5px]">{r.description}</td>
                          <td className="p-2 text-right">
                            {r.debit ? formatMoney(r.debit, currency) : "—"}
                          </td>
                          <td className="p-2 text-right">
                            {r.credit ? formatMoney(r.credit, currency) : "—"}
                          </td>
                          <td className="p-2 text-right font-semibold">
                            {formatMoney(Math.abs(r.balance), currency)}{" "}
                            {r.balance >= 0 ? "Dr" : "Cr"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="aging">
            <Card>
              <CardContent className="pt-4">
                <table className="text-sm w-full">
                  <tbody>
                    <Aging label="Not due yet" v={account.aging.notDue} cur={currency} />
                    <Aging label="1–7 days" v={account.aging.d1_7} cur={currency} />
                    <Aging label="8–15 days" v={account.aging.d8_15} cur={currency} />
                    <Aging label="16–30 days" v={account.aging.d16_30} cur={currency} />
                    <Aging label="31–60 days" v={account.aging.d31_60} cur={currency} />
                    <Aging label="60+ days" v={account.aging.d61_plus} cur={currency} warn />
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <section className="doc-preview-pane flex-1 bg-muted/30 overflow-y-auto">
        <Tabs defaultValue="consolidated">
          <div className="doc-preview-toolbar sticky top-0 z-10 bg-background/90 backdrop-blur border-b px-4 py-2 flex items-center justify-between print:hidden flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <TabsList>
                <TabsTrigger value="consolidated">
                  <Receipt className="size-3.5" /> Consolidated
                </TabsTrigger>
                <TabsTrigger value="statement">
                  <FileText className="size-3.5" /> Statement
                </TabsTrigger>
              </TabsList>
              <LanguageToggle lang={lang} onChange={setLang} />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const el = document.querySelector(
                    ".doc-sheet:not(.hidden)",
                  ) as HTMLElement | null;
                  if (el) printElement(el);
                }}
              >
                <Printer />
                Print
              </Button>
              <Button
                size="sm"
                onClick={downloadConsolidated}
                className="bg-navy text-navy-foreground"
              >
                <Download />
                Consolidated PDF
              </Button>
              <Button size="sm" onClick={downloadStatement} variant="outline">
                <Download />
                Statement PDF
              </Button>
            </div>
          </div>
          <div className="doc-preview-scroll">
            <div className="doc-preview-inner p-6 flex justify-center">
              <TabsContent value="consolidated">
                <div ref={consolidatedRef}>
                  <ConsolidatedInvoicePreview
                    client={client}
                    account={account}
                    periodFrom={periodFrom}
                    periodTo={periodTo}
                    number={`CONS-${accountNumber}-${new Date().toISOString().slice(0, 10)}`}
                    lang={lang}
                  />
                </div>
              </TabsContent>
              <TabsContent value="statement">
                <div ref={statementRef}>
                  <ClientAccountStatementPreview
                    client={client}
                    account={account}
                    periodFrom={periodFrom}
                    periodTo={periodTo}
                    openingBalance={account.totals.openingBalance}
                    preparedBy={preparedBy}
                    accountNumber={accountNumber}
                    lang={lang}
                  />
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </section>

      <PaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        client={client}
        currency={currency}
        invoices={account.invoices}
        presetInvoiceId={presetInv}
      />
      <CreditNoteDialog
        open={cnOpen}
        onOpenChange={setCnOpen}
        client={client}
        currency={currency}
        invoices={account.invoices}
        presetInvoiceId={presetCnInv}
      />
      <DebitNoteDialog
        open={dnOpen}
        onOpenChange={setDnOpen}
        client={client}
        currency={currency}
        invoices={account.invoices}
      />
      <RefundDialog open={rfOpen} onOpenChange={setRfOpen} client={client} currency={currency} />
      <AdjustmentDialog
        open={adjOpen}
        onOpenChange={setAdjOpen}
        client={client}
        currency={currency}
      />
      <OpeningBalanceDialog
        open={obOpen}
        onOpenChange={setObOpen}
        client={client}
        currency={currency}
      />
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
function KPI({
  label,
  value,
  tone,
  highlight,
}: {
  label: string;
  value: string;
  tone?: "warn";
  highlight?: boolean;
}) {
  return (
    <div
      className={`border rounded p-2 ${highlight ? "border-2 border-amber-500 bg-amber-50" : "bg-card"}`}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-base font-bold ${tone === "warn" ? "text-destructive" : "doc-navy"}`}>
        {value}
      </div>
    </div>
  );
}
function Aging({
  label,
  v,
  cur,
  warn,
}: {
  label: string;
  v: number;
  cur: Currency;
  warn?: boolean;
}) {
  return (
    <tr className="border-b">
      <td className="py-1.5">{label}</td>
      <td className={`py-1.5 text-right font-medium ${warn && v > 0 ? "text-destructive" : ""}`}>
        {formatMoney(v, cur)}
      </td>
    </tr>
  );
}
