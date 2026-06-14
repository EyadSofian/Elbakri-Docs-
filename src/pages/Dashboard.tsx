import { Link } from "react-router-dom";
import { FileText, Ticket, BookOpen, FolderOpen, Plus, TrendingUp, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInvoices, useVouchers, useStatements, useClients } from "@/lib/storage";
import { formatMoney, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function Dashboard() {
  useDocumentTitle("Dashboard — Elbakri Overseas");
  const [invoices] = useInvoices();
  const [vouchers] = useVouchers();
  const [statements] = useStatements();
  const [clients] = useClients();

  const totalBilledUSD = invoices
    .filter((i) => i.currency === "USD")
    .reduce((s, i) => {
      const sub = i.items.reduce((a, b) => a + b.total, 0);
      return s + (i.totalOverride ?? sub);
    }, 0);
  const unpaid = invoices.filter((i) => i.status === "Unpaid" || i.status === "Partial").length;

  const recent = [...invoices, ...vouchers, ...statements]
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 8);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Internal document studio · Elbakri Overseas · Est. 1982
          </p>
        </div>
        <div className="mobile-action-row flex flex-wrap gap-2">
          <Button asChild className="bg-navy text-navy-foreground hover:bg-navy/90">
            <Link to="/invoices/new">
              <Plus />
              New Invoice
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/vouchers/new">
              <Plus />
              Voucher
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/statements/new">
              <Plus />
              Statement
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText />}
          label="Invoices"
          value={invoices.length}
          hint={`${unpaid} unpaid/partial`}
        />
        <StatCard icon={<Ticket />} label="Vouchers" value={vouchers.length} />
        <StatCard icon={<BookOpen />} label="Statements" value={statements.length} />
        <StatCard
          icon={<DollarSign />}
          label="Billed (USD)"
          value={formatMoney(totalBilledUSD, "USD")}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4" /> Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {recent.length === 0 && (
              <div className="text-sm text-muted-foreground py-8 text-center">
                No documents yet. Start by creating an{" "}
                <Link to="/invoices/new" className="underline doc-navy">
                  invoice
                </Link>
                .
              </div>
            )}
            {recent.map((d: any) => {
              const isInv = d.kind === "invoice";
              const isVch = d.kind === "voucher";
              const link = isInv
                ? `/invoices/${d.id}`
                : isVch
                  ? `/vouchers/${d.id}`
                  : `/statements/${d.id}`;
              const title = isInv
                ? d.client?.name || "Untitled invoice"
                : isVch
                  ? d.guestNames || d.providerName || "Untitled voucher"
                  : d.customerName || "Untitled statement";
              return (
                <Link
                  key={d.id}
                  to={link}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="outline" className="uppercase text-[10px]">
                      {d.kind}
                    </Badge>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{title}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.number || d.accountNumber || "—"} ·{" "}
                        {formatDate(d.date || d.createdAt || d.periodFrom)}
                      </div>
                    </div>
                  </div>
                  {isInv && <Badge>{d.status}</Badge>}
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="size-4" /> Quick links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickLink
              to="/documents"
              label="All saved documents"
              sub={`${invoices.length + vouchers.length + statements.length} items`}
            />
            <QuickLink to="/clients" label="Clients & agencies" sub={`${clients.length} stored`} />
            <QuickLink to="/suppliers" label="Suppliers & hotels" />
            <QuickLink to="/templates" label="Service templates" />
            <QuickLink to="/settings" label="Company settings" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
          <span className="text-navy">{icon}</span>
        </div>
        <div className="text-2xl font-bold mt-1 doc-navy">{value}</div>
        {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
      </CardContent>
    </Card>
  );
}
function QuickLink({ to, label, sub }: { to: string; label: string; sub?: string }) {
  return (
    <Link to={to} className="block rounded-md border px-3 py-2 hover:bg-muted transition">
      <div className="text-sm font-medium">{label}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </Link>
  );
}
