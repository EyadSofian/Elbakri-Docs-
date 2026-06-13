import type { Invoice, Payment } from "@/lib/storage";
import { computeInvoiceTotals, formatMoney, formatDate } from "@/lib/format";
import { deriveInvoiceStatus, paymentsForInvoice } from "@/lib/account";
import { InvoicePreview } from "./InvoicePreview";
import { tt, type Lang } from "@/lib/i18n";

export function statusClass(status: string) {
  switch (status) {
    case "Paid": return "status-paid";
    case "Unpaid": return "status-unpaid";
    case "Partial": return "status-partial";
    case "Overdue": return "status-overdue";
    case "Cancelled": return "status-cancelled";
    default: return "status-draft";
  }
}

export function statusLabel(status: string, lang: Lang) {
  const t = tt(lang);
  switch (status) {
    case "Paid": return t.paidLabel;
    case "Unpaid": return t.unpaidLabel;
    case "Partial": return t.partiallyPaid;
    case "Overdue": return t.overdueLabel;
    case "Cancelled": return t.cancelledLabel;
    default: return t.draftLabel;
  }
}

/**
 * Wraps an InvoicePreview with: colored status badge overlay,
 * a CANCELLED watermark when applicable, and a payment-summary strip
 * appended after the sheet. The wrapper itself is a positioning container.
 */
export function BulkInvoiceCard({
  invoice, payments, lang = "en",
}: { invoice: Invoice; payments: Payment[]; lang?: Lang }) {
  const fromPayments = paymentsForInvoice(invoice.id, payments);
  const d = deriveInvoiceStatus(invoice, fromPayments);
  const totals = computeInvoiceTotals(invoice);
  const isCancelled = invoice.status === "Cancelled";
  const t = tt(lang);

  return (
    <div style={{ position: "relative" }} className={isCancelled ? "with-cancelled" : ""}>
      <InvoicePreview invoice={invoice} lang={lang} />

      {/* Status badge overlay (top-right of sheet) */}
      <div style={{ position: "absolute", top: "8mm", right: "14mm", zIndex: 5 }}>
        <span className={`status-badge ${statusClass(d.status)}`}>
          {statusLabel(d.status, lang)}
          {d.status === "Overdue" && d.daysOverdue > 0 && ` · ${t.overdueByDays(d.daysOverdue)}`}
        </span>
      </div>

      {/* Cancelled diagonal watermark */}
      {isCancelled && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", pointerEvents: "none", zIndex: 4,
        }}>
          <div style={{
            transform: "rotate(-28deg)", fontSize: 140, fontWeight: 900,
            color: "rgba(180,30,30,0.12)", letterSpacing: "0.12em", whiteSpace: "nowrap",
          }}>CANCELLED</div>
        </div>
      )}

      {/* Payment-summary strip overlay at the bottom inner area (above footer) */}
      <div style={{
        position: "absolute", left: "14mm", right: "14mm", bottom: "26mm",
        borderTop: "2px solid #c9a24a", paddingTop: 6, fontSize: 10.5, background: "white",
      }}>
        <table style={{ width: "100%" }}>
          <tbody>
            <tr>
              <td style={{ color: "#666" }}>{t.totalAmount}</td>
              <td style={{ textAlign: "right", fontWeight: 600 }}>{formatMoney(totals.grandTotal, invoice.currency)}</td>
              <td style={{ color: "#666", paddingLeft: 16 }}>{t.paidAmount}</td>
              <td style={{ textAlign: "right", fontWeight: 600, color: "#146c2e" }}>{formatMoney(d.paidAmount, invoice.currency)}</td>
              <td style={{ color: "#666", paddingLeft: 16 }}>{t.remainingAmount}</td>
              <td style={{ textAlign: "right", fontWeight: 700, color: d.remaining > 0 ? "#8a1414" : "#146c2e" }}>
                {formatMoney(d.remaining, invoice.currency)}
              </td>
              {invoice.dueDate && (<>
                <td style={{ color: "#666", paddingLeft: 16 }}>{t.dueDate}</td>
                <td style={{ textAlign: "right" }}>{formatDate(invoice.dueDate)}</td>
              </>)}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BulkExportSummary({
  invoices, payments, lang = "en", clientName, dateFrom, dateTo,
}: {
  invoices: Invoice[];
  payments: Payment[];
  lang?: Lang;
  clientName?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const t = tt(lang);
  const dir = lang === "ar" ? "rtl" : "ltr";
  const rows = invoices.map(inv => {
    const fromP = paymentsForInvoice(inv.id, payments);
    return { inv, ...deriveInvoiceStatus(inv, fromP) };
  });

  const groups: Record<string, typeof rows> = {
    Paid: [], Unpaid: [], Partial: [], Overdue: [], Cancelled: [], Draft: [],
  };
  for (const r of rows) (groups[r.status] ||= []).push(r);

  const sumGroup = (g: typeof rows) => ({
    count: g.length,
    total: g.reduce((s, r) => s + r.grandTotal, 0),
    paid: g.reduce((s, r) => s + r.paidAmount, 0),
    remaining: g.reduce((s, r) => s + r.remaining, 0),
  });

  // Group by client
  const byClient = new Map<string, typeof rows>();
  for (const r of rows) {
    const k = r.inv.client?.name || "—";
    if (!byClient.has(k)) byClient.set(k, []);
    byClient.get(k)!.push(r);
  }

  const totalAll = rows.reduce((s, r) => s + (r.inv.status === "Cancelled" ? 0 : r.grandTotal), 0);
  const paidAll = rows.reduce((s, r) => s + r.paidAmount, 0);
  const remAll = rows.reduce((s, r) => s + (r.inv.status === "Cancelled" ? 0 : r.remaining), 0);
  const currency = invoices[0]?.currency || "USD";

  return (
    <div className="doc-sheet" dir={dir}>
      <header style={{ borderBottom: "3px solid #14224a", paddingBottom: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#14224a" }}>{t.exportSummary}</div>
        <div style={{ fontSize: 10, color: "#666", marginTop: 4 }}>
          ELBAKRI OVERSEAS · {new Date().toLocaleDateString("en-GB")}
        </div>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16, fontSize: 11 }}>
        <div>
          {clientName && <div><strong>{t.customer}:</strong> {clientName}</div>}
          {(dateFrom || dateTo) && <div><strong>{t.period}:</strong> {formatDate(dateFrom || "")} → {formatDate(dateTo || "")}</div>}
          <div><strong>{t.selectedInvoices}:</strong> {rows.length}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div><strong>{t.totalAmount}:</strong> {formatMoney(totalAll, currency)}</div>
          <div style={{ color: "#146c2e" }}><strong>{t.paidAmount}:</strong> {formatMoney(paidAll, currency)}</div>
          <div style={{ color: "#8a1414" }}><strong>{t.remainingAmount}:</strong> {formatMoney(remAll, currency)}</div>
        </div>
      </section>

      <table style={{ width: "100%", fontSize: 11, marginBottom: 16, border: "1px solid #ddd" }}>
        <thead>
          <tr className="doc-navy-bg">
            <th style={{ textAlign: "left" }}>{t.invoiceStatusLabel}</th>
            <th style={{ textAlign: "right" }}>#</th>
            <th style={{ textAlign: "right" }}>{t.totalAmount}</th>
            <th style={{ textAlign: "right" }}>{t.paidAmount}</th>
            <th style={{ textAlign: "right" }}>{t.remainingAmount}</th>
          </tr>
        </thead>
        <tbody>
          {(["Paid","Partial","Unpaid","Overdue","Cancelled","Draft"] as const).map(st => {
            const g = groups[st] || [];
            if (!g.length) return null;
            const s = sumGroup(g);
            return (
              <tr key={st} style={{ borderTop: "1px solid #eee" }}>
                <td>
                  <span className={`status-badge ${statusClass(st)}`}>{statusLabel(st, lang)}</span>
                </td>
                <td style={{ textAlign: "right" }}>{s.count}</td>
                <td style={{ textAlign: "right" }}>{formatMoney(s.total, currency)}</td>
                <td style={{ textAlign: "right" }}>{formatMoney(s.paid, currency)}</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>{formatMoney(s.remaining, currency)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {byClient.size > 1 && (
        <section>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#14224a", marginBottom: 6 }}>By client</div>
          <table style={{ width: "100%", fontSize: 11, border: "1px solid #ddd" }}>
            <thead>
              <tr className="doc-navy-bg">
                <th style={{ textAlign: "left" }}>{t.customer}</th>
                <th style={{ textAlign: "right" }}>#</th>
                <th style={{ textAlign: "right" }}>{t.totalAmount}</th>
                <th style={{ textAlign: "right" }}>{t.paidAmount}</th>
                <th style={{ textAlign: "right" }}>{t.remainingAmount}</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(byClient.entries()).map(([name, g]) => {
                const s = sumGroup(g);
                return (
                  <tr key={name} style={{ borderTop: "1px solid #eee" }}>
                    <td>{name}</td>
                    <td style={{ textAlign: "right" }}>{s.count}</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(s.total, currency)}</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(s.paid, currency)}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{formatMoney(s.remaining, currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
