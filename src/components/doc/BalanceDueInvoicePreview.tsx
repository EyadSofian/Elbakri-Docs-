import { DocHeader, DocFooter } from "./DocChrome";
import { PAYMENT_METHODS, type Invoice, type Payment, type CreditNote } from "@/lib/storage";
import { computeInvoiceTotals, formatDate, formatMoney } from "@/lib/format";
import { tt, type Lang } from "@/lib/i18n";

export interface BalanceDueData {
  invoice: Invoice;
  payments: Payment[]; // payments for this client (filtered upstream)
  creditNotes: CreditNote[]; // credit notes for this client
}

function paymentsForInvoice(invoiceId: string, payments: Payment[]) {
  const rows: { payment: Payment; applied: number }[] = [];
  for (const p of payments) {
    const applied = p.allocations
      .filter((a) => a.invoiceId === invoiceId)
      .reduce((s, a) => s + (Number(a.amount) || 0), 0);
    if (applied > 0) rows.push({ payment: p, applied });
  }
  return rows.sort((a, b) => (a.payment.date || "").localeCompare(b.payment.date || ""));
}

export function BalanceDueInvoicePreview({
  invoice,
  payments,
  creditNotes,
  lang = "en",
  preparedBy = "",
  number,
}: BalanceDueData & {
  lang?: Lang;
  preparedBy?: string;
  number?: string;
}) {
  const t = tt(lang);
  const dir = lang === "ar" ? "rtl" : "ltr";
  const totals = computeInvoiceTotals(invoice);
  const cur = invoice.currency;

  const appliedPayments = paymentsForInvoice(invoice.id, payments);
  const totalPaidFromAllocations = appliedPayments.reduce((s, r) => s + r.applied, 0);
  const baseline = Number(invoice.paidAmount) || 0;
  const totalPaid = Math.max(0, baseline + totalPaidFromAllocations);

  const cnForInv = creditNotes.filter((c) => c.invoiceId === invoice.id);
  const totalCredit = cnForInv.reduce((s, c) => s + (Number(c.amount) || 0), 0);

  const isCancelled = invoice.status === "Cancelled";
  const remaining = isCancelled ? 0 : Math.max(0, totals.grandTotal - totalPaid - totalCredit);

  const today = new Date();
  let status: string = "Unpaid";
  if (isCancelled) status = "Cancelled";
  else if (remaining <= 0.0001 && totals.grandTotal > 0) status = "Paid";
  else if (totalPaid > 0 && remaining > 0) status = "Partially Paid";
  if (status !== "Paid" && status !== "Cancelled" && invoice.dueDate) {
    const d = new Date(invoice.dueDate);
    if (!isNaN(d.getTime()) && d.getTime() < today.getTime() && remaining > 0) status = "Overdue";
  }
  const statusAr =
    status === "Paid"
      ? "مدفوعة"
      : status === "Cancelled"
        ? "ملغاة"
        : status === "Partially Paid"
          ? "مدفوعة جزئياً"
          : status === "Overdue"
            ? "متأخرة"
            : "غير مدفوعة";

  const methodLabel = (m: string) => {
    const def = PAYMENT_METHODS.find((x) => x.value === m);
    return def ? (lang === "ar" ? def.labelAr : def.label) : m;
  };

  const balanceDueNumber = number || `BDI-${invoice.number}`;
  const docDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="doc-sheet" dir={dir}>
      <DocHeader
        title={lang === "ar" ? "فاتورة بالرصيد المتبقي" : "BALANCE DUE INVOICE"}
        subtitle={
          lang === "ar"
            ? `مرتبطة بالفاتورة ${invoice.number}`
            : `Linked to Invoice ${invoice.number}`
        }
        number={balanceDueNumber}
        date={formatDate(docDate)}
        status={lang === "ar" ? statusAr : status.toUpperCase()}
        lang={lang}
      />

      <section className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
            {t.billTo}
          </div>
          <div className="doc-navy font-semibold text-[13px]">{invoice.client.name || "—"}</div>
          {invoice.client.address && (
            <div className="text-[10px] text-neutral-600 whitespace-pre-line">
              {invoice.client.address}
            </div>
          )}
          <div className="text-[10px] text-neutral-600 mt-1 space-y-0.5">
            {invoice.client.email && <div>{invoice.client.email}</div>}
            {invoice.client.phone && <div>{invoice.client.phone}</div>}
            {invoice.client.taxId && <div>Tax ID: {invoice.client.taxId}</div>}
          </div>
        </div>
        <div className="text-right text-[10.5px]">
          <KV
            k={lang === "ar" ? "رقم الفاتورة الأصلية" : "Original Invoice #"}
            v={invoice.number}
          />
          <KV
            k={lang === "ar" ? "تاريخ الفاتورة الأصلية" : "Original Invoice Date"}
            v={formatDate(invoice.date)}
          />
          {invoice.dueDate && <KV k={t.dueDate} v={formatDate(invoice.dueDate)} />}
          {invoice.bookingRef && <KV k={t.bookingRef} v={invoice.bookingRef} />}
          <KV k={t.currency} v={cur} />
          {preparedBy && <KV k={t.preparedBy} v={preparedBy} />}
        </div>
      </section>

      {/* Summary box */}
      <section className="border-2 border-amber-500 rounded mb-4 bg-amber-50/40">
        <div className="px-3 py-2 doc-navy-bg text-[10px] uppercase tracking-wider font-semibold">
          {lang === "ar" ? "ملخص الرصيد" : "Balance Summary"}
        </div>
        <div className="grid grid-cols-5 gap-2 p-3 text-[10.5px]">
          <SBox
            k={lang === "ar" ? "قيمة الفاتورة الأصلية" : "Original Invoice Amount"}
            v={formatMoney(totals.grandTotal, cur)}
          />
          <SBox
            k={lang === "ar" ? "إجمالي المدفوع" : "Total Paid"}
            v={formatMoney(totalPaid, cur)}
          />
          <SBox
            k={
              lang === "ar"
                ? "إجمالي الخصومات / الإشعارات الدائنة"
                : "Total Credit Notes / Discounts"
            }
            v={formatMoney(totalCredit, cur)}
          />
          <SBox
            k={lang === "ar" ? "الرصيد المتبقي" : "Remaining Balance"}
            v={formatMoney(remaining, cur)}
          />
          <SBox
            k={lang === "ar" ? "المبلغ المطلوب سداده الآن" : "Amount Due Now"}
            v={formatMoney(remaining, cur)}
            highlight
          />
        </div>
      </section>

      {/* Payment history table */}
      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
        {lang === "ar" ? "سجل المدفوعات" : "Payment History"}
      </div>
      <table className="text-[10px] border border-neutral-200 w-full mb-4">
        <thead>
          <tr className="doc-navy-bg text-left">
            <th>{lang === "ar" ? "تاريخ الدفع" : "Payment Date"}</th>
            <th>{lang === "ar" ? "رقم الدفعة" : "Payment Number"}</th>
            <th>{lang === "ar" ? "طريقة الدفع" : "Payment Method"}</th>
            <th>{lang === "ar" ? "مرجع الدفع" : "Payment Reference"}</th>
            <th className="text-right">{lang === "ar" ? "قيمة الدفع" : "Paid Amount"}</th>
          </tr>
        </thead>
        <tbody>
          {appliedPayments.length === 0 && baseline === 0 && (
            <tr>
              <td colSpan={5} className="text-center text-neutral-400 py-4">
                {lang === "ar" ? "لا توجد مدفوعات مسجلة." : "No payments recorded yet."}
              </td>
            </tr>
          )}
          {baseline > 0 && (
            <tr className="border-t border-neutral-200">
              <td>{formatDate(invoice.date)}</td>
              <td className="font-medium">—</td>
              <td className="text-neutral-500">
                {lang === "ar" ? "رصيد افتتاحي" : "Initial paid"}
              </td>
              <td>—</td>
              <td className="text-right font-semibold">{formatMoney(baseline, cur)}</td>
            </tr>
          )}
          {appliedPayments.map(({ payment, applied }) => (
            <tr key={payment.id} className="border-t border-neutral-200">
              <td>{formatDate(payment.date)}</td>
              <td className="font-medium">{payment.number}</td>
              <td>{methodLabel(payment.method)}</td>
              <td>{payment.reference || "—"}</td>
              <td className="text-right font-semibold">{formatMoney(applied, cur)}</td>
            </tr>
          ))}
          <tr className="doc-gold-bg">
            <td colSpan={4} className="font-bold uppercase text-[10px] tracking-wider">
              {lang === "ar" ? "إجمالي المدفوع" : "Total Paid"}
            </td>
            <td className="text-right font-bold">{formatMoney(totalPaid, cur)}</td>
          </tr>
        </tbody>
      </table>

      {cnForInv.length > 0 && (
        <>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
            {lang === "ar" ? "الإشعارات الدائنة / الخصومات" : "Credit Notes / Deductions"}
          </div>
          <table className="text-[10px] border border-neutral-200 w-full mb-4">
            <thead>
              <tr className="doc-navy-bg text-left">
                <th>{t.date}</th>
                <th>{t.no}</th>
                <th>{t.reason}</th>
                <th className="text-right">{t.amount}</th>
              </tr>
            </thead>
            <tbody>
              {cnForInv.map((c) => (
                <tr key={c.id} className="border-t border-neutral-200">
                  <td>{formatDate(c.date)}</td>
                  <td className="font-medium">{c.number}</td>
                  <td className="capitalize">{String(c.reason || "").replace(/_/g, " ")}</td>
                  <td className="text-right font-semibold">{formatMoney(c.amount, cur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Original invoice services table */}
      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
        {lang === "ar"
          ? "خدمات الفاتورة الأصلية (للمرجعية)"
          : "Original Invoice Services (for reference)"}
      </div>
      <table className="text-[10px] border border-neutral-200 w-full mb-4">
        <thead>
          <tr className="doc-navy-bg text-left">
            <th>{t.serviceDescription}</th>
            <th>{t.bookingReference}</th>
            <th className="text-right w-12">{t.qty}</th>
            <th className="text-right w-24">{t.unitPrice}</th>
            <th className="text-right w-28">
              {lang === "ar" ? "القيمة الأصلية" : "Original Amount"}
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((it) => (
            <tr key={it.id} className="border-t border-neutral-200 align-top">
              <td>
                <div className="font-semibold doc-navy">{it.description || it.type}</div>
                {it.passengerName && (
                  <div className="text-neutral-500 text-[9.5px]">{it.passengerName}</div>
                )}
              </td>
              <td>{it.bookingRef || invoice.bookingRef || "—"}</td>
              <td className="text-right">{it.quantity}</td>
              <td className="text-right">{formatMoney(it.unitPrice, cur)}</td>
              <td className="text-right font-semibold doc-navy">{formatMoney(it.total, cur)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Final payment request box */}
      <section className="border-2 border-amber-500 rounded p-4 bg-amber-50 text-center mt-4">
        <div className="text-[10px] uppercase tracking-wider text-neutral-600">
          {lang === "ar" ? "المبلغ المطلوب سداده الآن" : "Amount Due Now"}
        </div>
        <div className="text-[28px] font-extrabold doc-navy mt-1">
          {formatMoney(remaining, cur)}
        </div>
        {(invoice.payment.bankName || invoice.payment.iban) && (
          <div className="mt-3 text-[10px] text-neutral-700 grid grid-cols-2 gap-x-6 gap-y-0.5 text-left max-w-xl mx-auto">
            {invoice.payment.bankName && <KV k={t.bank} v={invoice.payment.bankName} />}
            {invoice.payment.accountNumber && (
              <KV k={t.account} v={invoice.payment.accountNumber} />
            )}
            {invoice.payment.iban && <KV k={t.iban} v={invoice.payment.iban} />}
            {invoice.payment.swift && <KV k={t.swift} v={invoice.payment.swift} />}
          </div>
        )}
      </section>

      <div className="mt-3 text-[9.5px] text-neutral-500 italic">
        {lang === "ar"
          ? "هذا المستند طلب سداد بالرصيد المتبقي للفاتورة الأصلية ولا يعتبر فاتورة جديدة."
          : "This document is a payment request for the remaining balance of the original invoice and does NOT constitute a new accounting invoice."}
      </div>

      <DocFooter lang={lang} />
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
      <div className={`font-bold doc-navy ${highlight ? "text-[15px]" : "text-[12px]"}`}>{v}</div>
    </div>
  );
}
