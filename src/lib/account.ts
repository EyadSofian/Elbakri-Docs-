// Client account / ledger / payment allocation computations.
import type {
  Invoice, Payment, CreditNote, DebitNote, Refund, ManualAdjustment,
  Client, Currency, DocStatus,
} from "./storage";
import { computeInvoiceTotals } from "./format";

export interface InvoiceLedger {
  original: number;
  paid: number;
  creditApplied: number;
  cancelled: number;
  remaining: number;
  status: DocStatus;
  daysOverdue: number;
}

export interface InvoiceWithPayments {
  invoice: Invoice;
  grandTotal: number;       // original
  paidAmount: number;
  creditApplied: number;
  cancelledAmount: number;
  remaining: number;
  effectiveStatus: DocStatus;
  daysOverdue: number;
}

function diffDays(a: Date, b: Date) {
  return Math.floor((a.getTime() - b.getTime()) / 86400000);
}

export function paymentsForInvoice(invoiceId: string, payments: Payment[]): number {
  let s = 0;
  for (const p of payments) for (const a of p.allocations) if (a.invoiceId === invoiceId) s += Number(a.amount) || 0;
  return s;
}
export function creditNotesForInvoice(invoiceId: string, notes: CreditNote[]): number {
  return notes.filter(c => c.invoiceId === invoiceId).reduce((s, c) => s + (Number(c.amount) || 0), 0);
}
export function debitNotesForInvoice(invoiceId: string, notes: DebitNote[]): number {
  return notes.filter(c => c.invoiceId === invoiceId).reduce((s, c) => s + (Number(c.amount) || 0), 0);
}

export function computeInvoiceLedger(
  invoice: Invoice,
  payments: Payment[],
  creditNotes: CreditNote[],
  today = new Date(),
): InvoiceLedger {
  const totals = computeInvoiceTotals(invoice);
  const baseline = Number(invoice.paidAmount) || 0;
  const original = totals.grandTotal;
  const paid = Math.max(0, baseline + paymentsForInvoice(invoice.id, payments));
  const creditApplied = creditNotesForInvoice(invoice.id, creditNotes);
  const cancelled = invoice.status === "Cancelled" ? original : 0;
  const remaining = invoice.status === "Cancelled"
    ? 0
    : Math.max(0, original - paid - creditApplied);

  let status: DocStatus = invoice.status;
  if (invoice.status === "Cancelled" || invoice.status === "Draft") {
    // keep
  } else if (remaining <= 0.0001 && original > 0) status = "Paid";
  else if (paid + creditApplied > 0 && remaining > 0) status = "Partial";
  else status = "Unpaid";

  let daysOverdue = 0;
  if (status !== "Paid" && status !== "Cancelled" && status !== "Draft" && invoice.dueDate) {
    const d = new Date(invoice.dueDate);
    if (!isNaN(d.getTime())) {
      const diff = diffDays(today, d);
      if (diff > 0) { daysOverdue = diff; status = "Overdue"; }
    }
  }
  return { original, paid, creditApplied, cancelled, remaining, status, daysOverdue };
}

export function invoicesForClient(client: Client, invoices: Invoice[]): Invoice[] {
  return invoices.filter(i =>
    (client.id && i.clientId === client.id) ||
    (!i.clientId && i.client?.name && i.client.name.toLowerCase() === client.name.toLowerCase()),
  );
}

export interface ClientAccount {
  client: Client;
  currency: Currency;
  invoices: InvoiceWithPayments[];
  payments: Payment[];
  creditNotes: CreditNote[];
  debitNotes: DebitNote[];
  refunds: Refund[];
  adjustments: ManualAdjustment[];
  totals: {
    invoiceCount: number;
    paidCount: number;
    partialCount: number;
    unpaidCount: number;
    overdueCount: number;
    cancelledCount: number;
    totalInvoiced: number;
    totalPaid: number;          // allocated to invoices
    totalReceived: number;      // total received from payments (incl. unallocated)
    totalOutstanding: number;
    totalOverdue: number;
    totalCreditNotes: number;
    totalDebitNotes: number;
    totalRefunds: number;
    totalAdjDebit: number;
    totalAdjCredit: number;
    creditBalance: number;
    runningBalance: number;     // Σ Debit − Σ Credit (incl. opening)
    openingBalance: number;
  };
  aging: { notDue: number; d1_7: number; d8_15: number; d16_30: number; d31_60: number; d61_plus: number; };
  lastInvoiceDate?: string;
  lastPaymentDate?: string;
}

export function computeClientAccount(opts: {
  client: Client;
  invoices: Invoice[];
  payments: Payment[];
  creditNotes: CreditNote[];
  debitNotes?: DebitNote[];
  refunds?: Refund[];
  adjustments?: ManualAdjustment[];
  currency?: Currency;
  today?: Date;
}): ClientAccount {
  const today = opts.today ?? new Date();
  const debitNotesAll = opts.debitNotes || [];
  const refundsAll = opts.refunds || [];
  const adjustmentsAll = opts.adjustments || [];
  const clientInvoices = invoicesForClient(opts.client, opts.invoices);
  const clientPayments = opts.payments.filter(p => p.clientId === opts.client.id);
  const clientCN = opts.creditNotes.filter(c => c.clientId === opts.client.id);
  const clientDN = debitNotesAll.filter(d => d.clientId === opts.client.id);
  const clientRF = refundsAll.filter(r => r.clientId === opts.client.id);
  const clientADJ = adjustmentsAll.filter(a => a.clientId === opts.client.id);

  const currency = opts.currency
    || clientInvoices[0]?.currency
    || clientPayments[0]?.currency
    || opts.client.openingBalanceCurrency
    || "USD";

  const rows: InvoiceWithPayments[] = clientInvoices
    .filter(i => i.currency === currency)
    .map(invoice => {
      const led = computeInvoiceLedger(invoice, clientPayments.filter(p => p.currency === currency), clientCN.filter(c => c.currency === currency), today);
      return {
        invoice,
        grandTotal: led.original,
        paidAmount: led.paid,
        creditApplied: led.creditApplied,
        cancelledAmount: led.cancelled,
        remaining: led.remaining,
        effectiveStatus: led.status,
        daysOverdue: led.daysOverdue,
      };
    });

  const payments = clientPayments.filter(p => p.currency === currency);
  const creditNotes = clientCN.filter(c => c.currency === currency);
  const debitNotes = clientDN.filter(d => d.currency === currency);
  const refunds = clientRF.filter(r => r.currency === currency);
  const adjustments = clientADJ.filter(a => a.currency === currency);

  const totalInvoiced = rows.reduce((s, r) => r.invoice.status === "Cancelled" ? s : s + r.grandTotal, 0);
  const totalPaid = rows.reduce((s, r) => s + r.paidAmount, 0);
  const totalReceived = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalOutstanding = rows.reduce((s, r) => r.invoice.status === "Cancelled" ? s : s + r.remaining, 0);
  const totalOverdue = rows.reduce((s, r) => s + (r.effectiveStatus === "Overdue" ? r.remaining : 0), 0);
  const totalCreditNotes = creditNotes.reduce((s, c) => s + (Number(c.amount)||0), 0);
  const totalDebitNotes = debitNotes.reduce((s, d) => s + (Number(d.amount)||0), 0);
  const totalRefunds = refunds.reduce((s, r) => s + (Number(r.amount)||0), 0);
  const totalAdjDebit = adjustments.filter(a => a.direction === "debit").reduce((s, a) => s + a.amount, 0);
  const totalAdjCredit = adjustments.filter(a => a.direction === "credit").reduce((s, a) => s + a.amount, 0);

  // unallocated payments + unlinked credit notes − unlinked debit notes = credit balance available
  const unallocated = Math.max(0, totalReceived - totalPaid);
  const unlinkedCN = creditNotes.filter(c => !c.invoiceId).reduce((s, c) => s + c.amount, 0);
  const unlinkedDN = debitNotes.filter(d => !d.invoiceId).reduce((s, d) => s + d.amount, 0);
  const creditBalance = Math.max(0, unallocated + unlinkedCN - unlinkedDN);

  const openingBalance = (opts.client.openingBalanceCurrency || currency) === currency
    ? (Number(opts.client.openingBalance) || 0)
    : 0;

  // Ledger: invoices+debit notes+refunds+adj-debit = debits, payments+credit notes+adj-credit = credits
  const runningBalance =
    openingBalance
    + totalInvoiced + totalDebitNotes + totalRefunds + totalAdjDebit
    - totalReceived - totalCreditNotes - totalAdjCredit;

  const aging = { notDue: 0, d1_7: 0, d8_15: 0, d16_30: 0, d31_60: 0, d61_plus: 0 };
  for (const r of rows) {
    if (r.remaining <= 0 || r.invoice.status === "Cancelled") continue;
    const od = r.daysOverdue;
    if (od <= 0) aging.notDue += r.remaining;
    else if (od <= 7) aging.d1_7 += r.remaining;
    else if (od <= 15) aging.d8_15 += r.remaining;
    else if (od <= 30) aging.d16_30 += r.remaining;
    else if (od <= 60) aging.d31_60 += r.remaining;
    else aging.d61_plus += r.remaining;
  }

  const counts = {
    invoiceCount: rows.length,
    paidCount: rows.filter(r => r.effectiveStatus === "Paid").length,
    partialCount: rows.filter(r => r.effectiveStatus === "Partial").length,
    unpaidCount: rows.filter(r => r.effectiveStatus === "Unpaid" || r.effectiveStatus === "Overdue").length,
    overdueCount: rows.filter(r => r.effectiveStatus === "Overdue").length,
    cancelledCount: rows.filter(r => r.invoice.status === "Cancelled").length,
  };

  const lastInvoiceDate = clientInvoices.map(i => i.date).filter(Boolean).sort().slice(-1)[0];
  const lastPaymentDate = clientPayments.map(p => p.date).filter(Boolean).sort().slice(-1)[0];

  return {
    client: opts.client, currency,
    invoices: rows, payments, creditNotes, debitNotes, refunds, adjustments,
    totals: {
      ...counts,
      totalInvoiced, totalPaid, totalReceived, totalOutstanding, totalOverdue,
      totalCreditNotes, totalDebitNotes, totalRefunds, totalAdjDebit, totalAdjCredit,
      creditBalance, runningBalance, openingBalance,
    },
    aging, lastInvoiceDate, lastPaymentDate,
  };
}

// ===== Ledger =====
export type LedgerType = "opening" | "invoice" | "payment" | "credit_note" | "debit_note" | "refund" | "adjustment" | "cancellation";

export interface LedgerRow {
  id: string;
  date: string;
  type: LedgerType;
  number: string;
  bookingRef?: string;
  description: string;
  invoiceAmount: number;
  paidAmount: number;
  remaining: number;
  debit: number;
  credit: number;
  status?: DocStatus;
  balance: number;
}

export function buildLedger(account: ClientAccount, openingBalanceOverride?: number): LedgerRow[] {
  const items: Omit<LedgerRow, "balance">[] = [];
  const cur = account.currency;
  const opening = openingBalanceOverride != null ? openingBalanceOverride : account.totals.openingBalance;

  if (opening !== 0 || true) {
    items.push({
      id: "opening", date: "0000-00-00", type: "opening", number: "—",
      description: "Opening balance",
      invoiceAmount: 0, paidAmount: 0, remaining: 0,
      debit: opening > 0 ? opening : 0,
      credit: opening < 0 ? -opening : 0,
    });
  }

  for (const r of account.invoices) {
    if (r.invoice.status === "Cancelled") {
      // Show as cancellation reversal entry
      items.push({
        id: "i-" + r.invoice.id, date: r.invoice.date, type: "invoice",
        number: r.invoice.number, bookingRef: r.invoice.bookingRef,
        description: r.invoice.items.map(it => it.description || it.type).filter(Boolean).slice(0,2).join(", ") || "Invoice",
        invoiceAmount: r.grandTotal, paidAmount: 0, remaining: 0,
        debit: r.grandTotal, credit: 0, status: "Cancelled",
      });
      items.push({
        id: "cx-" + r.invoice.id, date: r.invoice.date, type: "cancellation",
        number: r.invoice.number, bookingRef: r.invoice.bookingRef,
        description: "Cancelled invoice — reversal",
        invoiceAmount: 0, paidAmount: 0, remaining: 0,
        debit: 0, credit: r.grandTotal, status: "Cancelled",
      });
      continue;
    }
    items.push({
      id: "i-" + r.invoice.id, date: r.invoice.date, type: "invoice",
      number: r.invoice.number, bookingRef: r.invoice.bookingRef,
      description: r.invoice.items.map(it => it.description || it.type).filter(Boolean).slice(0,2).join(", ") || "Invoice",
      invoiceAmount: r.grandTotal, paidAmount: r.paidAmount, remaining: r.remaining,
      debit: r.grandTotal, credit: 0, status: r.effectiveStatus,
    });
  }
  for (const p of account.payments) {
    items.push({
      id: "p-" + p.id, date: p.date, type: "payment", number: p.number,
      description: `Payment received · ${p.method.replace("_"," ")}${p.reference ? ` · ref ${p.reference}` : ""}`,
      invoiceAmount: 0, paidAmount: 0, remaining: 0,
      debit: 0, credit: p.amount,
    });
  }
  for (const c of account.creditNotes) {
    items.push({
      id: "c-" + c.id, date: c.date, type: "credit_note", number: c.number,
      description: `Credit note${c.reason ? ` · ${c.reason}` : ""}${c.invoiceId ? ` · vs ${c.invoiceId.slice(0,6)}` : ""}`,
      invoiceAmount: 0, paidAmount: 0, remaining: 0,
      debit: 0, credit: c.amount,
    });
  }
  for (const d of account.debitNotes) {
    items.push({
      id: "d-" + d.id, date: d.date, type: "debit_note", number: d.number,
      description: `Debit note${d.reason ? ` · ${d.reason}` : ""}`,
      invoiceAmount: 0, paidAmount: 0, remaining: 0,
      debit: d.amount, credit: 0,
    });
  }
  for (const rf of account.refunds) {
    items.push({
      id: "r-" + rf.id, date: rf.date, type: "refund", number: rf.number,
      description: `Refund · ${rf.method.replace("_"," ")}${rf.reference ? ` · ref ${rf.reference}` : ""}`,
      invoiceAmount: 0, paidAmount: 0, remaining: 0,
      debit: rf.amount, credit: 0,
    });
  }
  for (const a of account.adjustments) {
    items.push({
      id: "a-" + a.id, date: a.date, type: "adjustment", number: a.number,
      description: `Adjustment · ${a.reason || a.direction}`,
      invoiceAmount: 0, paidAmount: 0, remaining: 0,
      debit: a.direction === "debit" ? a.amount : 0,
      credit: a.direction === "credit" ? a.amount : 0,
    });
  }

  items.sort((a, b) => {
    if (a.type === "opening") return -1;
    if (b.type === "opening") return 1;
    return (a.date || "").localeCompare(b.date || "");
  });

  let balance = 0;
  return items.map(it => {
    balance += it.debit - it.credit;
    return { ...it, balance };
  });
}
// silence unused import
void (null as unknown as Currency);

// Backwards-compatibility shim used by bulk-export & BulkInvoiceCard.
export function deriveInvoiceStatus(
  inv: Invoice, paidFromPayments: number, today = new Date(),
): { paidAmount: number; remaining: number; status: DocStatus; daysOverdue: number; grandTotal: number } {
  const totals = computeInvoiceTotals(inv);
  const paid = Math.max(0, (Number(inv.paidAmount) || 0) + paidFromPayments);
  const remaining = Math.max(0, totals.grandTotal - paid);
  let status: DocStatus = inv.status;
  if (inv.status === "Cancelled" || inv.status === "Draft") {
    // keep
  } else if (remaining <= 0.0001 && totals.grandTotal > 0) status = "Paid";
  else if (paid > 0 && remaining > 0) status = "Partial";
  else status = "Unpaid";
  let daysOverdue = 0;
  if (status !== "Paid" && status !== "Cancelled" && status !== "Draft" && inv.dueDate) {
    const d = new Date(inv.dueDate);
    if (!isNaN(d.getTime())) {
      const diff = diffDays(today, d);
      if (diff > 0) { daysOverdue = diff; status = "Overdue"; }
    }
  }
  return { paidAmount: paid, remaining, status, daysOverdue, grandTotal: totals.grandTotal };
}
