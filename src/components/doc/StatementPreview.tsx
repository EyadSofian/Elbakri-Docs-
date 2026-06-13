import { DocHeader, DocFooter } from "./DocChrome";
import type { Statement } from "@/lib/storage";
import { formatDate, formatMoney } from "@/lib/format";
import { tt, type Lang } from "@/lib/i18n";

export function StatementPreview({
  statement,
  lang = "en",
}: {
  statement: Statement;
  lang?: Lang;
}) {
  const t = tt(lang);
  const dir = lang === "ar" ? "rtl" : "ltr";
  let running = statement.openingBalance;
  const rows = statement.transactions.map((tx) => {
    running = running + (Number(tx.debit) || 0) - (Number(tx.credit) || 0);
    return { ...tx, balance: running };
  });
  const totalDebit = statement.transactions.reduce((s, tx) => s + (Number(tx.debit) || 0), 0);
  const totalCredit = statement.transactions.reduce((s, tx) => s + (Number(tx.credit) || 0), 0);
  const closing = statement.openingBalance + totalDebit - totalCredit;
  const cur = statement.currency;

  return (
    <div className="doc-sheet doc-sheet--landscape" dir={dir}>
      <DocHeader
        title={t.statementOfAccount}
        subtitle={`${t.period}: ${formatDate(statement.periodFrom)} — ${formatDate(statement.periodTo)}`}
        lang={lang}
      />

      <section className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
            {t.customer}
          </div>
          <div className="doc-navy font-semibold text-[13px]">
            {statement.customerName || statement.accountName || "—"}
          </div>
          <div className="text-[10.5px] text-neutral-600">
            {statement.accountName && (
              <div>
                {t.account}: {statement.accountName}
              </div>
            )}
            {statement.accountNumber && (
              <div>
                {t.no}: {statement.accountNumber}
              </div>
            )}
            <div>
              {t.currency}: {cur}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
            {t.preparedBy}
          </div>
          <div className="text-[10.5px]">
            <span className="font-medium">{statement.preparedBy || "—"}</span>
          </div>
          <div className="text-[10.5px]">
            {t.printedAt}: {new Date().toLocaleString(lang === "ar" ? "ar-EG" : "en-GB")}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-5 gap-2 mb-4">
        <div className="border rounded p-2 bg-neutral-50">
          <div className="text-[9px] uppercase text-neutral-500">{t.transactions}</div>
          <div className="text-[14px] font-bold doc-navy">{statement.transactions.length}</div>
        </div>
        <div className="border rounded p-2 bg-neutral-50">
          <div className="text-[9px] uppercase text-neutral-500">{t.openingBalance}</div>
          <div className="text-[14px] font-bold doc-navy">
            {formatMoney(statement.openingBalance, cur)}
          </div>
        </div>
        <div className="border rounded p-2 bg-neutral-50">
          <div className="text-[9px] uppercase text-neutral-500">{t.totalDebit}</div>
          <div className="text-[14px] font-bold doc-navy">{formatMoney(totalDebit, cur)}</div>
        </div>
        <div className="border rounded p-2 bg-neutral-50">
          <div className="text-[9px] uppercase text-neutral-500">{t.totalCredit}</div>
          <div className="text-[14px] font-bold doc-navy">{formatMoney(totalCredit, cur)}</div>
        </div>
        <div className="border-2 border-amber-500 rounded p-2 bg-amber-50">
          <div className="text-[9px] uppercase text-neutral-500">{t.closingBalance}</div>
          <div className="text-[14px] font-bold doc-navy">
            {formatMoney(Math.abs(closing), cur)} {closing >= 0 ? "Dr" : "Cr"}
          </div>
        </div>
      </div>

      <table className="border border-neutral-200 text-[10.5px] w-full">
        <thead>
          <tr className="doc-navy-bg">
            <th className="text-left w-24">{t.date}</th>
            <th className="text-left w-24">{t.voucher}</th>
            <th className="text-left w-24">{t.invoice}</th>
            <th className="text-left">{t.description}</th>
            <th className="text-right w-24">{t.debit}</th>
            <th className="text-right w-24">{t.credit}</th>
            <th className="text-right w-28">{t.balance}</th>
            <th className="text-center w-12">{t.type}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-neutral-200 bg-neutral-50">
            <td colSpan={3}></td>
            <td className="font-semibold doc-navy">{t.openingBalance}</td>
            <td></td>
            <td></td>
            <td className="text-right font-semibold doc-navy">
              {formatMoney(statement.openingBalance, cur)}
            </td>
            <td className="text-center">{statement.openingBalance >= 0 ? "Dr" : "Cr"}</td>
          </tr>
          {rows.map((tx) => (
            <tr key={tx.id} className="border-t border-neutral-200 align-top">
              <td>{formatDate(tx.date)}</td>
              <td>{tx.voucher || "—"}</td>
              <td>{tx.invoice || "—"}</td>
              <td className="whitespace-pre-line">{tx.description}</td>
              <td className="text-right">{tx.debit ? formatMoney(tx.debit, cur) : "—"}</td>
              <td className="text-right">{tx.credit ? formatMoney(tx.credit, cur) : "—"}</td>
              <td className="text-right font-medium">{formatMoney(Math.abs(tx.balance), cur)}</td>
              <td className="text-center">{tx.balance >= 0 ? "Dr" : "Cr"}</td>
            </tr>
          ))}
          <tr className="doc-gold-bg">
            <td colSpan={4} className="font-bold uppercase text-[10px] tracking-wider">
              {t.closing}
            </td>
            <td className="text-right font-bold">{formatMoney(totalDebit, cur)}</td>
            <td className="text-right font-bold">{formatMoney(totalCredit, cur)}</td>
            <td className="text-right font-bold">{formatMoney(Math.abs(closing), cur)}</td>
            <td className="text-center font-bold">{closing >= 0 ? "Dr" : "Cr"}</td>
          </tr>
        </tbody>
      </table>

      <DocFooter lang={lang} extra={t.approvalNote} />
    </div>
  );
}
