import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, ExternalLink } from "lucide-react";
import { useClients, useInvoices, usePayments, useCreditNotes } from "@/lib/storage";
import { computeClientAccount } from "@/lib/account";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/accounts")({
  head: () => ({ meta: [{ title: "Client Accounts — Elbakri Overseas" }] }),
  component: AccountsPage,
});

function AccountsPage() {
  const [clients] = useClients();
  const [invoices] = useInvoices();
  const [payments] = usePayments();
  const [creditNotes] = useCreditNotes();
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    return clients.map(client => ({
      client,
      account: computeClientAccount({ client, invoices, payments, creditNotes }),
    }));
  }, [clients, invoices, payments, creditNotes]);

  const filtered = rows.filter(r => !q || r.client.name.toLowerCase().includes(q.toLowerCase()) || r.client.email.toLowerCase().includes(q.toLowerCase()));

  const grand = filtered.reduce(
    (s, r) => ({
      invoiced: s.invoiced + r.account.totals.totalInvoiced,
      paid: s.paid + r.account.totals.totalPaid,
      outstanding: s.outstanding + r.account.totals.totalOutstanding,
      overdue: s.overdue + r.account.totals.totalOverdue,
    }),
    { invoiced: 0, paid: 0, outstanding: 0, overdue: 0 },
  );

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="size-6 doc-navy" />Client Accounts</h1>
          <p className="text-sm text-muted-foreground">B2B account ledger · invoices, payments, balances, and consolidated PDFs.</p>
        </div>
        <Link to="/clients" className="text-sm underline doc-navy">Manage client database</Link>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Total Invoiced" value={fmt(grand.invoiced)} />
        <KPI label="Total Paid" value={fmt(grand.paid)} />
        <KPI label="Total Outstanding" value={fmt(grand.outstanding)} />
        <KPI label="Overdue" value={fmt(grand.overdue)} tone="warn" />
      </div>

      <div className="relative max-w-md">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search clients…" value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
      </div>

      <Card><CardContent className="p-0 divide-y">
        {filtered.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No clients yet. Add some in the Clients section.</div>}
        {filtered.map(({ client, account }) => (
          <Link
            key={client.id}
            to="/accounts/$id"
            params={{ id: client.id }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold doc-navy truncate">{client.name || "—"}</span>
                {account.totals.overdueCount > 0 && <Badge variant="destructive">Overdue × {account.totals.overdueCount}</Badge>}
                {account.totals.creditBalance > 0 && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Credit {formatMoney(account.totals.creditBalance, account.currency)}</Badge>}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {account.totals.invoiceCount} invoices · Paid {account.totals.paidCount} · Partial {account.totals.partialCount} · Unpaid {account.totals.unpaidCount}
              </div>
            </div>
            <div className="hidden md:grid grid-cols-3 gap-4 text-right text-xs shrink-0">
              <div><div className="text-muted-foreground">Invoiced</div><div className="font-semibold">{formatMoney(account.totals.totalInvoiced, account.currency)}</div></div>
              <div><div className="text-muted-foreground">Paid</div><div className="font-semibold">{formatMoney(account.totals.totalPaid, account.currency)}</div></div>
              <div><div className="text-muted-foreground">Outstanding</div><div className="font-bold doc-navy">{formatMoney(account.totals.totalOutstanding, account.currency)}</div></div>
            </div>
            <ExternalLink className="size-4 text-muted-foreground" />
          </Link>
        ))}
      </CardContent></Card>
    </div>
  );
}

function fmt(v: number) { return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function KPI({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <Card><CardContent className="pt-5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold ${tone === "warn" ? "text-destructive" : "doc-navy"}`}>{value}</div>
    </CardContent></Card>
  );
}
