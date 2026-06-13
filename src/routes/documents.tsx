import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, FileText, Ticket, BookOpen, ExternalLink, Trash2 } from "lucide-react";
import { useInvoices, useVouchers, useStatements } from "@/lib/storage";
import { formatDate, formatMoney, computeInvoiceTotals } from "@/lib/format";

export const Route = createFileRoute("/documents")({
  head: () => ({ meta: [{ title: "Saved Documents — Elbakri Overseas" }] }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const [q, setQ] = useState("");
  const [invoices, setInvoices] = useInvoices();
  const [vouchers, setVouchers] = useVouchers();
  const [statements, setStatements] = useStatements();

  const filterStr = q.toLowerCase().trim();
  const matchesInv = (i: any) => !filterStr || [i.number, i.client?.name, i.bookingRef, i.status, i.date].some(v => String(v||"").toLowerCase().includes(filterStr));
  const matchesVch = (v: any) => !filterStr || [v.number, v.providerName, v.guestNames, v.leaderGuest, v.serviceBookingRef].some(x => String(x||"").toLowerCase().includes(filterStr));
  const matchesSt  = (s: any) => !filterStr || [s.accountName, s.accountNumber, s.customerName].some(x => String(x||"").toLowerCase().includes(filterStr));

  const fInv = useMemo(() => invoices.filter(matchesInv), [invoices, q]);
  const fVch = useMemo(() => vouchers.filter(matchesVch), [vouchers, q]);
  const fSt  = useMemo(() => statements.filter(matchesSt), [statements, q]);

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Saved Documents</h1>
          <p className="text-sm text-muted-foreground">Search by number, client, guest, booking ref, status or date.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/invoices/new">New invoice</Link></Button>
          <Button asChild variant="outline"><Link to="/vouchers/new">New voucher</Link></Button>
          <Button asChild variant="outline"><Link to="/statements/new">New statement</Link></Button>
        </div>
      </header>

      <div className="relative max-w-md">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search documents…" value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices"><FileText className="size-3.5" /> Invoices ({fInv.length})</TabsTrigger>
          <TabsTrigger value="vouchers"><Ticket className="size-3.5" /> Vouchers ({fVch.length})</TabsTrigger>
          <TabsTrigger value="statements"><BookOpen className="size-3.5" /> Statements ({fSt.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card><CardContent className="p-0 divide-y">
            {fInv.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">No invoices.</div>}
            {fInv.map(i => {
              const t = computeInvoiceTotals(i);
              return (
                <Link key={i.id} to="/invoices/$id" params={{ id: i.id }} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted transition">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="font-semibold doc-navy">{i.number}</span><Badge variant="outline">{i.status}</Badge></div>
                    <div className="text-sm truncate">{i.client.name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(i.date)} {i.bookingRef && `· ${i.bookingRef}`}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold doc-navy">{formatMoney(t.grandTotal, i.currency)}</div>
                    <div className="text-[10px] text-muted-foreground">{i.items.length} item(s)</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); if (confirm("Delete invoice?")) setInvoices(prev => prev.filter(x => x.id !== i.id)); }} className="text-destructive"><Trash2 className="size-4" /></Button>
                  <ExternalLink className="size-4 text-muted-foreground" />
                </Link>
              );
            })}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="vouchers">
          <Card><CardContent className="p-0 divide-y">
            {fVch.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">No vouchers.</div>}
            {fVch.map(v => (
              <Link key={v.id} to="/vouchers/$id" params={{ id: v.id }} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted transition">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold doc-navy">{v.number}</div>
                  <div className="text-sm truncate">{v.providerName || "—"} · {v.leaderGuest || v.guestNames}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(v.checkIn)} → {formatDate(v.checkOut)}</div>
                </div>
                <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); if (confirm("Delete voucher?")) setVouchers(prev => prev.filter(x => x.id !== v.id)); }} className="text-destructive"><Trash2 className="size-4" /></Button>
                <ExternalLink className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="statements">
          <Card><CardContent className="p-0 divide-y">
            {fSt.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">No statements.</div>}
            {fSt.map(s => (
              <Link key={s.id} to="/statements/$id" params={{ id: s.id }} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted transition">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold doc-navy">{s.customerName || s.accountName || "—"}</div>
                  <div className="text-sm text-muted-foreground">{s.accountNumber} · {s.currency}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(s.periodFrom)} → {formatDate(s.periodTo)} · {s.transactions.length} txns</div>
                </div>
                <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); if (confirm("Delete statement?")) setStatements(prev => prev.filter(x => x.id !== s.id)); }} className="text-destructive"><Trash2 className="size-4" /></Button>
                <ExternalLink className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
