import { DocHeader, DocFooter } from "@/components/doc/DocChrome";
import type { Client, Currency } from "@/lib/storage";
import type { ClientAccount, InvoiceWithPayments } from "@/lib/account";
import { formatDate, formatMoney } from "@/lib/format";
import { tt, type Lang } from "@/lib/i18n";

export function ConsolidatedInvoicePreview({
  client, account, periodFrom, periodTo, lang = "en", number,
}: {
  client: Client;
  account: ClientAccount;
  periodFrom?: string;
  periodTo?: string;
  number?: string;
  lang?: Lang;
}) {
  const t = tt(lang);
  const dir = lang === "ar" ? "rtl" : "ltr";
  const cur: Currency = account.currency;

  const filterRange = (r: InvoiceWithPayments) => {
    if (!periodFrom && !periodTo) return true;
    const d = r.invoice.date || "";
    if (periodFrom && d < periodFrom) return false;
    if (periodTo && d > periodTo) return false;
    return true;
  };

  const due = account.invoices
    .filter(filterRange)
    .filter(r => r.invoice.status !== "Cancelled" && r.remaining > 0.0001);

  const totalInvoiced = due.reduce((s, r) => s + r.grandTotal, 0);
  const totalPaid = due.reduce((s, r) => s + r.paidAmount, 0);
  const totalDue = due.reduce((s, r) => s + r.remaining, 0);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="doc-sheet" dir={dir}>
      <DocHeader
        title={lang === "ar" ? t.consolidatedB2BInvoice : "CONSOLIDATED B2B INVOICE"}
        subtitle={t.consolidatedInvoice}
        number={number}
        date={formatDate(today)}
        status={lang === "ar" ? "مستحق" : "DUE"}
        lang={lang}
      />

      <section className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">{t.billTo}</div>
          <div className="doc-navy font-semibold text-[13px]">{client.name || "—"}</div>
          {client.address && <div className="text-[10px] text-neutral-600 whitespace-pre-line">{client.address}</div>}
          <div className="text-[10px] text-neutral-600 mt-1 space-y-0.5">
            {client.email && <div>Email: {client.email}</div>}
            {client.phone && <div>Phone: {client.phone}</div>}
            {client.taxId && <div>Tax ID: {client.taxId}</div>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">{t.statementPeriod}</div>
          <div className="text-[11px] font-medium">
            {periodFrom ? formatDate(periodFrom) : "—"} → {periodTo ? formatDate(periodTo) : "—"}
          </div>
          <div className="text-[10px] text-neutral-600 mt-1">{t.currency}: {cur}</div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 mb-4">
        <Stat label={t.totalInvoices} value={formatMoney(totalInvoiced, cur)} />
        <Stat label={t.totalPaid} value={formatMoney(totalPaid, cur)} />
        <Stat label={t.grandTotalDue} value={formatMoney(totalDue, cur)} highlight />
      </section>

      <table className="text-[10.5px] border border-neutral-200">
        <thead>
          <tr className="doc-navy-bg text-left">
            <th className="w-8">#</th>
            <th className="w-24">{t.date}</th>
            <th className="w-28">{t.invoice}</th>
            <th>{t.description}</th>
            <th className="w-20">{t.dueDate}</th>
            <th className="text-right w-24">{t.invoiceAmount}</th>
            <th className="text-right w-24">{t.paidAmount}</th>
            <th className="text-right w-24">{t.remainingAmount}</th>
          </tr>
        </thead>
        <tbody>
          {due.length === 0 && (
            <tr><td colSpan={8} className="text-center text-neutral-400 py-6">No outstanding invoices.</td></tr>
          )}
          {due.map((r, i) => (
            <tr key={r.invoice.id} className="border-t border-neutral-200 align-top">
              <td className="text-neutral-500">{i + 1}</td>
              <td>{formatDate(r.invoice.date)}</td>
              <td className="font-semibold doc-navy">{r.invoice.number}</td>
              <td>
                {r.invoice.bookingRef && <div className="text-[9.5px] text-neutral-500">Ref {r.invoice.bookingRef}</div>}
                <div>{r.invoice.items.map(it => it.description || it.type).filter(Boolean).slice(0, 3).join(", ") || "—"}</div>
                <div className="text-[9.5px] text-neutral-500 uppercase">{r.effectiveStatus}</div>
              </td>
              <td>{formatDate(r.invoice.dueDate)}</td>
              <td className="text-right">{formatMoney(r.grandTotal, cur)}</td>
              <td className="text-right">{formatMoney(r.paidAmount, cur)}</td>
              <td className="text-right font-semibold doc-navy">{formatMoney(r.remaining, cur)}</td>
            </tr>
          ))}
          <tr className="doc-gold-bg">
            <td colSpan={5} className="font-bold uppercase text-[10px] tracking-wider">{t.grandTotalDue}</td>
            <td className="text-right font-bold">{formatMoney(totalInvoiced, cur)}</td>
            <td className="text-right font-bold">{formatMoney(totalPaid, cur)}</td>
            <td className="text-right font-bold">{formatMoney(totalDue, cur)}</td>
          </tr>
        </tbody>
      </table>

      {account.totals.creditBalance > 0 && (
        <div className="mt-3 text-[10.5px] border rounded p-2 bg-emerald-50 border-emerald-300">
          <span className="font-semibold">{t.creditBalance}: </span>
          {formatMoney(account.totals.creditBalance, cur)}
        </div>
      )}

      <DocFooter lang={lang} extra={t.approvalNote} />
    </div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`border rounded p-2 ${highlight ? "border-2 border-amber-500 bg-amber-50" : "bg-neutral-50"}`}>
      <div className="text-[9px] uppercase text-neutral-500">{label}</div>
      <div className="text-[14px] font-bold doc-navy">{value}</div>
    </div>
  );
}
