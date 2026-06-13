import { DocHeader, DocFooter } from "@/components/doc/DocChrome";
import type { Client, Currency } from "@/lib/storage";
import type { ClientAccount, InvoiceWithPayments } from "@/lib/account";
import { formatDate, formatMoney } from "@/lib/format";
import { tt, type Lang } from "@/lib/i18n";
import { getSettings } from "@/lib/storage";

export interface ConsolidatedFilters {
  periodFrom?: string;
  periodTo?: string;
  includePaid: boolean;
  includeCancelled: boolean;
  includePaymentHistory: boolean;
  includeCreditNotes: boolean;
  includePreviousBalance: boolean;
  selectedIds?: string[]; // if present, restrict to these ids
}

export function ConsolidatedClientInvoicePreview({
  client,
  account,
  filters,
  number,
  lang = "en",
  preparedBy = "",
  accountNumber = "",
  dueDate = "",
}: {
  client: Client;
  account: ClientAccount;
  filters: ConsolidatedFilters;
  number?: string;
  lang?: Lang;
  preparedBy?: string;
  accountNumber?: string;
  dueDate?: string;
}) {
  const t = tt(lang);
  const dir = lang === "ar" ? "rtl" : "ltr";
  const cur: Currency = account.currency;
  const settings = getSettings();

  const inRange = (r: InvoiceWithPayments) => {
    const d = r.invoice.date || "";
    if (filters.periodFrom && d < filters.periodFrom) return false;
    if (filters.periodTo && d > filters.periodTo) return false;
    return true;
  };
  const matchesStatus = (r: InvoiceWithPayments) => {
    if (filters.selectedIds && filters.selectedIds.length > 0)
      return filters.selectedIds.includes(r.invoice.id);
    if (r.invoice.status === "Cancelled") return filters.includeCancelled;
    if (r.effectiveStatus === "Paid") return filters.includePaid;
    return true; // unpaid / partial / overdue
  };

  const rows = account.invoices.filter(inRange).filter(matchesStatus);

  const totalInvoiced = rows.reduce(
    (s, r) => (r.invoice.status === "Cancelled" ? s : s + r.grandTotal),
    0,
  );
  const totalPaid = rows.reduce((s, r) => s + r.paidAmount, 0);
  const totalCredit = rows.reduce((s, r) => s + r.creditApplied, 0);
  const totalCancelled = rows.reduce((s, r) => s + r.cancelledAmount, 0);
  const totalRemaining = rows.reduce((s, r) => s + r.remaining, 0);
  const previous = filters.includePreviousBalance ? account.totals.openingBalance : 0;
  const finalDue = Math.max(0, totalRemaining + previous);

  const today = new Date().toISOString().slice(0, 10);
  const statusLabel = (s: string) => {
    if (lang === "ar") {
      return s === "Paid"
        ? "مدفوعة"
        : s === "Partial"
          ? "مدفوعة جزئياً"
          : s === "Overdue"
            ? "متأخرة"
            : s === "Cancelled"
              ? "ملغاة"
              : s === "Unpaid"
                ? "غير مدفوعة"
                : s;
    }
    return s === "Partial" ? "Partially Paid" : s;
  };

  const paymentsIncluded = filters.includePaymentHistory
    ? account.payments.filter((p) => {
        if (filters.periodFrom && p.date < filters.periodFrom) return false;
        if (filters.periodTo && p.date > filters.periodTo) return false;
        return true;
      })
    : [];

  const creditNotesIncluded = filters.includeCreditNotes
    ? account.creditNotes.filter((c) => {
        if (filters.periodFrom && c.date < filters.periodFrom) return false;
        if (filters.periodTo && c.date > filters.periodTo) return false;
        return true;
      })
    : [];

  const invNumberById = (id?: string) =>
    id ? account.invoices.find((r) => r.invoice.id === id)?.invoice.number || "—" : "—";

  return (
    <div className="doc-sheet" dir={dir}>
      <DocHeader
        title={t.consolidatedClientInvoice}
        subtitle={lang === "ar" ? t.paymentSummary : "WITH PAYMENT SUMMARY"}
        number={number}
        date={formatDate(today)}
        status={
          finalDue > 0 ? (lang === "ar" ? "مستحق" : "DUE") : lang === "ar" ? "مسدد" : "SETTLED"
        }
        lang={lang}
      />

      <section className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
            {t.billTo}
          </div>
          <div className="doc-navy font-semibold text-[13px]">{client.name || "—"}</div>
          {client.address && (
            <div className="text-[10px] text-neutral-600 whitespace-pre-line">{client.address}</div>
          )}
          <div className="text-[10px] text-neutral-600 mt-1 space-y-0.5">
            {client.email && <div>{client.email}</div>}
            {client.phone && <div>{client.phone}</div>}
            {client.taxId && <div>Tax ID: {client.taxId}</div>}
          </div>
        </div>
        <div className="text-right text-[10.5px]">
          <KV k={t.accountNumber} v={accountNumber || client.id.slice(0, 8).toUpperCase()} />
          <KV k={t.currency} v={cur} />
          <KV
            k={t.statementPeriod}
            v={`${filters.periodFrom ? formatDate(filters.periodFrom) : "—"} → ${filters.periodTo ? formatDate(filters.periodTo) : "—"}`}
          />
          {preparedBy && <KV k={t.preparedBy} v={preparedBy} />}
        </div>
      </section>

      {/* Summary box */}
      <section className="border-2 border-amber-500 rounded mb-4 bg-amber-50/40">
        <div className="px-3 py-2 doc-navy-bg text-[10px] uppercase tracking-wider font-semibold">
          {t.paymentSummary}
        </div>
        <div className="grid grid-cols-4 gap-2 p-3 text-[10.5px]">
          <SBox k={t.totalInvoicedAmount} v={formatMoney(totalInvoiced, cur)} />
          <SBox k={t.totalPaidAmount} v={formatMoney(totalPaid, cur)} />
          <SBox k={t.totalCreditNotes} v={formatMoney(totalCredit, cur)} />
          <SBox k={t.totalCancelledAmount} v={formatMoney(totalCancelled, cur)} />
          {filters.includePreviousBalance && (
            <SBox k={t.previousBalance} v={formatMoney(previous, cur)} />
          )}
          <SBox k={t.currentRemainingBalance} v={formatMoney(totalRemaining, cur)} />
          <SBox k={t.finalAmountDue} v={formatMoney(finalDue, cur)} highlight />
        </div>
      </section>

      {/* Invoice breakdown */}
      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
        {t.invoiceBreakdown}
      </div>
      <table className="text-[10px] border border-neutral-200 w-full mb-4">
        <thead>
          <tr className="doc-navy-bg text-left">
            <th className="w-8">#</th>
            <th>{t.invoiceNumber}</th>
            <th>{t.date}</th>
            <th>{t.bookingReference}</th>
            <th>{t.serviceDescription}</th>
            <th className="text-right">{t.originalAmount}</th>
            <th className="text-right">{t.paidAmount}</th>
            <th className="text-right">{t.creditOrDiscount}</th>
            <th className="text-right">{t.cancelledAmount}</th>
            <th className="text-right">{t.remainingAmount}</th>
            <th>{t.invoiceStatusLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={11} className="text-center text-neutral-400 py-6">
                —
              </td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr key={r.invoice.id} className="border-t border-neutral-200 align-top">
              <td className="text-neutral-500">{i + 1}</td>
              <td className="font-semibold doc-navy">{r.invoice.number}</td>
              <td>{formatDate(r.invoice.date)}</td>
              <td>{r.invoice.bookingRef || "—"}</td>
              <td>
                {r.invoice.items
                  .map((it) => it.description || it.type)
                  .filter(Boolean)
                  .slice(0, 3)
                  .join(", ") || "—"}
              </td>
              <td className="text-right">{formatMoney(r.grandTotal, cur)}</td>
              <td className="text-right">{formatMoney(r.paidAmount, cur)}</td>
              <td className="text-right">{formatMoney(r.creditApplied, cur)}</td>
              <td className="text-right">{formatMoney(r.cancelledAmount, cur)}</td>
              <td className="text-right font-semibold doc-navy">{formatMoney(r.remaining, cur)}</td>
              <td className="text-[9.5px] uppercase">
                {statusLabel(r.effectiveStatus)}
                {r.daysOverdue > 0 ? ` · ${r.daysOverdue}d` : ""}
              </td>
            </tr>
          ))}
          <tr className="doc-gold-bg">
            <td colSpan={5} className="font-bold uppercase text-[10px] tracking-wider">
              {t.grandTotal}
            </td>
            <td className="text-right font-bold">{formatMoney(totalInvoiced, cur)}</td>
            <td className="text-right font-bold">{formatMoney(totalPaid, cur)}</td>
            <td className="text-right font-bold">{formatMoney(totalCredit, cur)}</td>
            <td className="text-right font-bold">{formatMoney(totalCancelled, cur)}</td>
            <td className="text-right font-bold">{formatMoney(totalRemaining, cur)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      {paymentsIncluded.length > 0 && (
        <>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
            {t.paymentHistory}
          </div>
          <table className="text-[10px] border border-neutral-200 w-full mb-4">
            <thead>
              <tr className="doc-navy-bg text-left">
                <th>{t.date}</th>
                <th>{t.no}</th>
                <th>{t.paymentMethod}</th>
                <th>{t.paymentReference}</th>
                <th>{t.appliedInvoice}</th>
                <th className="text-right">{t.amount}</th>
                <th>{t.notes}</th>
              </tr>
            </thead>
            <tbody>
              {paymentsIncluded.map((p) => (
                <tr key={p.id} className="border-t border-neutral-200 align-top">
                  <td>{formatDate(p.date)}</td>
                  <td className="font-medium">{p.number}</td>
                  <td className="capitalize">{p.method.replace("_", " ")}</td>
                  <td>{p.reference || "—"}</td>
                  <td>
                    {p.allocations.length === 0
                      ? "—"
                      : p.allocations.map((a) => invNumberById(a.invoiceId)).join(", ")}
                  </td>
                  <td className="text-right font-semibold">{formatMoney(p.amount, cur)}</td>
                  <td>{p.notes || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {creditNotesIncluded.length > 0 && (
        <>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
            {t.creditNotesDeductions}
          </div>
          <table className="text-[10px] border border-neutral-200 w-full mb-4">
            <thead>
              <tr className="doc-navy-bg text-left">
                <th>{t.date}</th>
                <th>{t.no}</th>
                <th>{t.relatedInvoice}</th>
                <th>{t.reason}</th>
                <th className="text-right">{t.amount}</th>
              </tr>
            </thead>
            <tbody>
              {creditNotesIncluded.map((c) => (
                <tr key={c.id} className="border-t border-neutral-200">
                  <td>{formatDate(c.date)}</td>
                  <td className="font-medium">{c.number}</td>
                  <td>{invNumberById(c.invoiceId)}</td>
                  <td className="capitalize">{String(c.reason || "").replace(/_/g, " ")}</td>
                  <td className="text-right font-semibold">{formatMoney(c.amount, cur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Final amount due */}
      <section className="grid grid-cols-3 gap-4 mt-4">
        <div className="col-span-2 border rounded p-3 bg-neutral-50 text-[10.5px]">
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
            {t.paymentInformation}
          </div>
          <div className="grid grid-cols-2 gap-1">
            {settings.defaultBank.bankName && <KV k={t.bank} v={settings.defaultBank.bankName} />}
            {settings.defaultBank.accountNumber && (
              <KV k={t.account} v={settings.defaultBank.accountNumber} />
            )}
            {settings.defaultBank.iban && <KV k={t.iban} v={settings.defaultBank.iban} />}
            {settings.defaultBank.swift && <KV k={t.swift} v={settings.defaultBank.swift} />}
            {dueDate && <KV k={t.dueDate} v={formatDate(dueDate)} />}
          </div>
          {settings.defaultBank.notes && (
            <div className="mt-1 text-neutral-600">{settings.defaultBank.notes}</div>
          )}
        </div>
        <div className="border-2 border-amber-500 rounded p-3 bg-amber-50 text-center">
          <div className="text-[10px] uppercase tracking-wider text-neutral-600">
            {t.totalAmountDueNow}
          </div>
          <div className="text-[24px] font-extrabold doc-navy mt-1">
            {formatMoney(finalDue, cur)}
          </div>
          {account.totals.creditBalance > 0 && (
            <div className="text-[10px] text-emerald-700 mt-1">
              {t.creditBalance}: {formatMoney(account.totals.creditBalance, cur)}
            </div>
          )}
        </div>
      </section>

      <DocFooter lang={lang} extra={t.approvalNote} />
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-neutral-500">{k}:</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
function SBox({ k, v, highlight = false }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div
      className={`border rounded p-2 ${highlight ? "border-2 border-amber-500 bg-amber-50" : "bg-white"}`}
    >
      <div className="text-[9px] uppercase text-neutral-500">{k}</div>
      <div className={`font-bold doc-navy ${highlight ? "text-[14px]" : "text-[12px]"}`}>{v}</div>
    </div>
  );
}
