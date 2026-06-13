import { DocHeader, DocFooter } from "@/components/doc/DocChrome";
import type { Client } from "@/lib/storage";
import { type ClientAccount, buildLedger } from "@/lib/account";
import { formatDate, formatMoney } from "@/lib/format";
import { tt, type Lang } from "@/lib/i18n";

export function ClientAccountStatementPreview({
  client, account, periodFrom, periodTo, openingBalance = 0, preparedBy = "",
  accountNumber = "", lang = "en",
}: {
  client: Client;
  account: ClientAccount;
  periodFrom?: string;
  periodTo?: string;
  openingBalance?: number;
  preparedBy?: string;
  accountNumber?: string;
  lang?: Lang;
}) {
  const t = tt(lang);
  const dir = lang === "ar" ? "rtl" : "ltr";
  const cur = account.currency;
  const all = buildLedger(account, openingBalance);
  const rows = all.filter(r => {
    if (periodFrom && r.date < periodFrom) return false;
    if (periodTo && r.date > periodTo) return false;
    return true;
  });
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const closing = openingBalance + totalDebit - totalCredit;

  const labelForType = (ty: string) =>
    ty === "invoice" ? t.invoice : ty === "payment" ? t.paymentsReceived : t.creditBalance;

  return (
    <div className="doc-sheet doc-sheet--landscape" dir={dir}>
      <DocHeader
        title={lang === "ar" ? t.consolidatedStatementTitle : "CLIENT ACCOUNT STATEMENT"}
        subtitle={`${t.period}: ${periodFrom ? formatDate(periodFrom) : "—"} → ${periodTo ? formatDate(periodTo) : "—"}`}
        lang={lang}
      />

      <section className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">{t.customer}</div>
          <div className="doc-navy font-semibold text-[13px]">{client.name || "—"}</div>
          <div className="text-[10.5px] text-neutral-600">
            {accountNumber && <div>{t.accountNumber}: {accountNumber}</div>}
            <div>{t.currency}: {cur}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">{t.preparedBy}</div>
          <div className="text-[10.5px]"><span className="font-medium">{preparedBy || "—"}</span></div>
          <div className="text-[10.5px]">{t.printedAt}: {new Date().toLocaleString(lang === "ar" ? "ar-EG" : "en-GB")}</div>
        </div>
      </section>

      <div className="grid grid-cols-6 gap-2 mb-4">
        <K label={t.openingBalance} value={formatMoney(openingBalance, cur)} />
        <K label={t.totalInvoices} value={formatMoney(account.totals.totalInvoiced, cur)} />
        <K label={t.totalPaid} value={formatMoney(account.totals.totalPaid, cur)} />
        <K label={t.totalUnpaid} value={formatMoney(account.totals.totalOutstanding, cur)} />
        <K label={t.overdueAmount} value={formatMoney(account.totals.totalOverdue, cur)} />
        <K label={t.closingBalance} value={`${formatMoney(Math.abs(closing), cur)} ${closing >= 0 ? "Dr" : "Cr"}`} highlight />
      </div>

      <table className="border border-neutral-200 text-[10px] w-full">
        <thead>
          <tr className="doc-navy-bg">
            <th className="text-left w-20">{t.date}</th>
            <th className="text-left w-20">{t.documentType}</th>
            <th className="text-left w-24">{t.no}</th>
            <th className="text-left w-20">{t.bookingRef}</th>
            <th className="text-left">{t.description}</th>
            <th className="text-right w-20">{t.invoiceAmount}</th>
            <th className="text-right w-20">{t.paidAmount}</th>
            <th className="text-right w-20">{t.remainingAmount}</th>
            <th className="text-right w-20">{t.debit}</th>
            <th className="text-right w-20">{t.credit}</th>
            <th className="text-right w-24">{t.runningBalance}</th>
            <th className="text-center w-10">{t.type}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-neutral-200 bg-neutral-50">
            <td colSpan={4}></td>
            <td className="font-semibold doc-navy">{t.openingBalance}</td>
            <td colSpan={5}></td>
            <td className="text-right font-semibold doc-navy">{formatMoney(Math.abs(openingBalance), cur)}</td>
            <td className="text-center">{openingBalance >= 0 ? "Dr" : "Cr"}</td>
          </tr>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-neutral-200 align-top">
              <td>{formatDate(r.date)}</td>
              <td className="uppercase text-[9px] text-neutral-600">{labelForType(r.type)}</td>
              <td className="font-medium">{r.number}</td>
              <td>{r.bookingRef || "—"}</td>
              <td className="whitespace-pre-line">{r.description}</td>
              <td className="text-right">{r.invoiceAmount ? formatMoney(r.invoiceAmount, cur) : "—"}</td>
              <td className="text-right">{r.paidAmount ? formatMoney(r.paidAmount, cur) : "—"}</td>
              <td className="text-right">{r.type === "invoice" ? formatMoney(r.remaining, cur) : "—"}</td>
              <td className="text-right">{r.debit ? formatMoney(r.debit, cur) : "—"}</td>
              <td className="text-right">{r.credit ? formatMoney(r.credit, cur) : "—"}</td>
              <td className="text-right font-medium">{formatMoney(Math.abs(r.balance), cur)}</td>
              <td className="text-center">{r.balance >= 0 ? "Dr" : "Cr"}</td>
            </tr>
          ))}
          <tr className="doc-gold-bg">
            <td colSpan={8} className="font-bold uppercase text-[10px] tracking-wider">{t.closing}</td>
            <td className="text-right font-bold">{formatMoney(totalDebit, cur)}</td>
            <td className="text-right font-bold">{formatMoney(totalCredit, cur)}</td>
            <td className="text-right font-bold">{formatMoney(Math.abs(closing), cur)}</td>
            <td className="text-center font-bold">{closing >= 0 ? "Dr" : "Cr"}</td>
          </tr>
        </tbody>
      </table>

      <section className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">{t.agingSummary}</div>
          <table className="text-[10.5px] w-full border">
            <tbody>
              <Aging label={t.notDueYet} value={account.aging.notDue} cur={cur} />
              <Aging label={t.overdue1_7} value={account.aging.d1_7} cur={cur} />
              <Aging label={t.overdue8_15} value={account.aging.d8_15} cur={cur} />
              <Aging label={t.overdue16_30} value={account.aging.d16_30} cur={cur} />
              <Aging label={t.overdue31_60} value={account.aging.d31_60} cur={cur} />
              <Aging label={t.overdue61} value={account.aging.d61_plus} cur={cur} />
            </tbody>
          </table>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Summary</div>
          <table className="text-[10.5px] w-full border">
            <tbody>
              <tr><td className="px-2 py-1 text-neutral-500">{t.paidInvoices}</td><td className="px-2 py-1 text-right">{account.totals.paidCount}</td></tr>
              <tr><td className="px-2 py-1 text-neutral-500">{t.partiallyPaidInvoices}</td><td className="px-2 py-1 text-right">{account.totals.partialCount}</td></tr>
              <tr><td className="px-2 py-1 text-neutral-500">{t.unpaidInvoices}</td><td className="px-2 py-1 text-right">{account.totals.unpaidCount}</td></tr>
              <tr><td className="px-2 py-1 text-neutral-500">{t.overdueInvoices}</td><td className="px-2 py-1 text-right">{account.totals.overdueCount}</td></tr>
              <tr className="border-t"><td className="px-2 py-1 font-semibold">{t.creditBalance}</td><td className="px-2 py-1 text-right font-semibold">{formatMoney(account.totals.creditBalance, cur)}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <DocFooter lang={lang} extra={t.approvalNote} />
    </div>
  );
}

function K({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`border rounded p-2 ${highlight ? "border-2 border-amber-500 bg-amber-50" : "bg-neutral-50"}`}>
      <div className="text-[9px] uppercase text-neutral-500">{label}</div>
      <div className="text-[12px] font-bold doc-navy">{value}</div>
    </div>
  );
}
function Aging({ label, value, cur }: { label: string; value: number; cur: any }) {
  return (
    <tr>
      <td className="px-2 py-1 text-neutral-600">{label}</td>
      <td className="px-2 py-1 text-right font-medium">{formatMoney(value, cur)}</td>
    </tr>
  );
}
