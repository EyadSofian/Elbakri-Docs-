import { DocHeader, DocFooter } from "./DocChrome";
import { SERVICE_TYPES, type Invoice } from "@/lib/storage";
import { computeInvoiceTotals, formatDate, formatMoney } from "@/lib/format";
import { tt, type Lang } from "@/lib/i18n";
import { PaymentMethodsBox, TermsPage } from "@/components/doc/CommercialTerms";

const serviceLabel = (t: string) => SERVICE_TYPES.find((s) => s.value === t)?.label ?? t;
const stampUrl = "/elbakri-stamp.png";

function itemSummary(it: Invoice["items"][number]) {
  const m = it.meta || {};
  const parts: string[] = [];
  if (it.type === "hotel") {
    if (m.hotelName) parts.push(`${m.hotelName}${m.rating ? ` ${m.rating}★` : ""}`);
    if (m.roomType) parts.push(`${m.rooms || 1} × ${m.roomType}`);
    if (m.checkIn && m.checkOut) parts.push(`${formatDate(m.checkIn)} → ${formatDate(m.checkOut)}`);
    if (m.board) parts.push(m.board);
  } else if (it.type === "tour") {
    if (m.tourName) parts.push(m.tourName);
    if (m.city) parts.push(m.city);
    if (m.tourDate) parts.push(formatDate(m.tourDate));
  } else if (it.type === "transfer") {
    if (m.transferType) parts.push(m.transferType);
    if (m.from || m.to) parts.push(`${m.from || "?"} → ${m.to || "?"}`);
    if (m.date) parts.push(formatDate(m.date));
  } else if (it.type === "flight") {
    if (m.airline) parts.push(m.airline);
    if (m.route) parts.push(m.route);
    if (m.pnr) parts.push(`PNR ${m.pnr}`);
  } else if (it.type === "visa") {
    if (m.country) parts.push(m.country);
    if (m.visaType) parts.push(m.visaType);
  } else if (it.type === "package") {
    if (m.packageName) parts.push(m.packageName);
    if (m.destination) parts.push(m.destination);
  } else if (it.type === "activity") {
    if (m.activityName) parts.push(m.activityName);
    if (m.date) parts.push(formatDate(m.date));
  }
  return parts.join(" · ");
}

export function InvoicePreview({ invoice, lang = "en" }: { invoice: Invoice; lang?: Lang }) {
  const totals = computeInvoiceTotals(invoice);
  const t = tt(lang);
  const dir = lang === "ar" ? "rtl" : "ltr";
  return (
    <>
      <div className="doc-sheet" dir={dir}>
        <DocHeader
          title={t.taxInvoice}
          subtitle={t.travelServices}
          number={invoice.number}
          date={formatDate(invoice.date)}
          status={invoice.status}
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
              {invoice.client.email && <div>Email: {invoice.client.email}</div>}
              {invoice.client.phone && <div>Phone: {invoice.client.phone}</div>}
              {invoice.client.taxId && <div>Tax ID: {invoice.client.taxId}</div>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
              {t.invoiceDetails}
            </div>
            <table className="ml-auto text-[10.5px]">
              <tbody>
                <tr>
                  <td className="text-neutral-500 pr-3">{t.invoiceDate}</td>
                  <td className="font-medium text-right">{formatDate(invoice.date)}</td>
                </tr>
                <tr>
                  <td className="text-neutral-500 pr-3">{t.dueDate}</td>
                  <td className="font-medium text-right">{formatDate(invoice.dueDate)}</td>
                </tr>
                {invoice.bookingRef && (
                  <tr>
                    <td className="text-neutral-500 pr-3">{t.bookingRef}</td>
                    <td className="font-medium text-right">{invoice.bookingRef}</td>
                  </tr>
                )}
                <tr>
                  <td className="text-neutral-500 pr-3">{t.currency}</td>
                  <td className="font-medium text-right">{invoice.currency}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <table className="text-[10.5px] border border-neutral-200 rounded overflow-hidden">
          <thead>
            <tr className="doc-navy-bg text-left">
              <th className="w-8">#</th>
              <th>{t.service}</th>
              <th className="text-right w-10">{t.qty}</th>
              <th className="text-right w-20">{t.unit}</th>
              <th className="text-right w-24">{t.unitPrice}</th>
              <th className="text-right w-28">{t.amount}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it, i) => (
              <tr key={it.id} className="border-t border-neutral-200 align-top">
                <td className="text-neutral-500">{i + 1}</td>
                <td>
                  <div className="font-semibold doc-navy">{serviceLabel(it.type)}</div>
                  {it.description && <div className="text-neutral-700">{it.description}</div>}
                  {itemSummary(it) && (
                    <div className="text-neutral-500 text-[9.5px] mt-0.5">{itemSummary(it)}</div>
                  )}
                  {it.passengerName && (
                    <div className="text-neutral-500 text-[9.5px]">Guest: {it.passengerName}</div>
                  )}
                  {(it.bookingRef || it.supplierRef) && (
                    <div className="text-neutral-500 text-[9.5px]">
                      {it.bookingRef && <>Booking {it.bookingRef}</>}
                      {it.bookingRef && it.supplierRef && " · "}
                      {it.supplierRef && <>Supplier {it.supplierRef}</>}
                    </div>
                  )}
                </td>
                <td className="text-right">{it.quantity}</td>
                <td className="text-right">{it.unit || "—"}</td>
                <td className="text-right">{formatMoney(it.unitPrice, invoice.currency)}</td>
                <td className="text-right font-semibold doc-navy">
                  {formatMoney(it.total, invoice.currency)}
                </td>
              </tr>
            ))}
            {invoice.items.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-neutral-400 py-6">
                  No services added.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <section className="grid grid-cols-5 gap-6 mt-4">
          <div className="col-span-3 space-y-3">
            {(invoice.notes || invoice.showPaymentMethods) && (
              <div className="invoice-notes-payment">
                {invoice.notes && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                      {t.notes}
                    </div>
                    <div className="text-[10.5px] whitespace-pre-line border rounded p-2 bg-neutral-50">
                      {invoice.notes}
                    </div>
                  </div>
                )}
                {invoice.showPaymentMethods && <PaymentMethodsBox lang={lang} />}
              </div>
            )}
            {(invoice.payment.bankName || invoice.payment.iban) && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                  {t.paymentInformation}
                </div>
                <table className="text-[10.5px] w-full">
                  <tbody>
                    {invoice.payment.bankName && (
                      <tr>
                        <td className="text-neutral-500 pr-2 w-28">{t.bank}</td>
                        <td>{invoice.payment.bankName}</td>
                      </tr>
                    )}
                    {invoice.payment.accountNumber && (
                      <tr>
                        <td className="text-neutral-500 pr-2">{t.account}</td>
                        <td>{invoice.payment.accountNumber}</td>
                      </tr>
                    )}
                    {invoice.payment.iban && (
                      <tr>
                        <td className="text-neutral-500 pr-2">{t.iban}</td>
                        <td>{invoice.payment.iban}</td>
                      </tr>
                    )}
                    {invoice.payment.swift && (
                      <tr>
                        <td className="text-neutral-500 pr-2">{t.swift}</td>
                        <td>{invoice.payment.swift}</td>
                      </tr>
                    )}
                    {invoice.payment.notes && (
                      <tr>
                        <td className="text-neutral-500 pr-2">{t.notes}</td>
                        <td>{invoice.payment.notes}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="col-span-2 border rounded">
            <table className="w-full text-[11px]">
              <tbody>
                <tr>
                  <td className="text-neutral-500 px-3 py-1.5">{t.subtotal}</td>
                  <td className="text-right px-3 py-1.5 font-medium">
                    {formatMoney(totals.subtotal, invoice.currency)}
                  </td>
                </tr>
                {totals.discount > 0 && (
                  <tr>
                    <td className="text-neutral-500 px-3 py-1.5">{t.discount}</td>
                    <td className="text-right px-3 py-1.5 font-medium">
                      −{formatMoney(totals.discount, invoice.currency)}
                    </td>
                  </tr>
                )}
                {invoice.vatPercent > 0 && (
                  <tr>
                    <td className="text-neutral-500 px-3 py-1.5">
                      {t.vat} ({invoice.vatPercent}%)
                    </td>
                    <td className="text-right px-3 py-1.5 font-medium">
                      {formatMoney(totals.vat, invoice.currency)}
                    </td>
                  </tr>
                )}
                <tr className="doc-navy-bg">
                  <td className="px-3 py-2 font-bold uppercase text-[10px] tracking-wider">
                    {t.grandTotal}
                  </td>
                  <td className="text-right px-3 py-2 font-bold">
                    {formatMoney(totals.grandTotal, invoice.currency)}
                  </td>
                </tr>
                {invoice.paidAmount > 0 && (
                  <>
                    <tr>
                      <td className="text-neutral-500 px-3 py-1.5">{t.paid}</td>
                      <td className="text-right px-3 py-1.5 font-medium">
                        {formatMoney(invoice.paidAmount, invoice.currency)}
                      </td>
                    </tr>
                    <tr className="border-t-2 border-amber-500">
                      <td className="px-3 py-1.5 font-semibold">{t.balanceDue}</td>
                      <td className="text-right px-3 py-1.5 font-bold doc-navy">
                        {formatMoney(totals.balance, invoice.currency)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="invoice-stamp" aria-hidden="true">
          <img src={stampUrl} alt="" crossOrigin="anonymous" />
        </div>

        <DocFooter lang={lang} />
      </div>
      {invoice.showTerms && <TermsPage lang={lang} documentType="invoice" />}
    </>
  );
}
