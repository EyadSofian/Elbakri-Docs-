import { useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Save, Download, Printer, Copy, Trash2, Receipt } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  type Invoice, type Client, useInvoices, useClients, useSettings,
  emptyServiceItem, emptyClient, uid,
} from "@/lib/storage";
import { computeInvoiceTotals, computeItemTotal, formatMoney } from "@/lib/format";
import { ServiceItemForm } from "@/components/doc/ServiceItemForm";
import { InvoicePreview } from "@/components/doc/InvoicePreview";
import { PickerCombo } from "@/components/doc/PickerCombo";
import { exportElementToPdf, printElement, sanitizeFilenamePart } from "@/lib/pdf";
import { LanguageToggle } from "@/components/doc/LanguageToggle";
import type { Lang } from "@/lib/i18n";

export function InvoiceEditor({ initial }: { initial: Invoice }) {
  const [invoice, setInvoice] = useState<Invoice>(initial);
  const [invoices, setInvoices] = useInvoices();
  const [clients, setClients] = useClients();
  const [settings] = useSettings();
  const [lang, setLang] = useState<Lang>("en");
  const previewRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const totals = useMemo(() => computeInvoiceTotals(invoice), [invoice]);
  const patch = (p: Partial<Invoice>) => setInvoice(v => ({ ...v, ...p }));
  const patchClient = (p: Partial<Client>) => setInvoice(v => ({ ...v, client: { ...v.client, ...p } }));

  const save = () => {
    setInvoices(prev => {
      const ix = prev.findIndex(p => p.id === invoice.id);
      if (ix === -1) return [invoice, ...prev];
      const next = [...prev]; next[ix] = invoice; return next;
    });
    toast.success("Invoice saved");
  };

  const remove = () => {
    if (!confirm("Delete this invoice?")) return;
    setInvoices(prev => prev.filter(p => p.id !== invoice.id));
    navigate({ to: "/documents" });
  };

  const duplicate = () => {
    const dup: Invoice = { ...invoice, id: uid(), number: invoice.number + "-COPY", createdAt: new Date().toISOString() };
    setInvoices(prev => [dup, ...prev]);
    navigate({ to: "/invoices/$id", params: { id: dup.id } });
    toast.success("Duplicated");
  };

  const downloadPdf = async () => {
    save();
    if (!previewRef.current) return;
    const tag = lang === "ar" ? "INVOICE-AR" : "B2B-INVOICE";
    const name = `ELBAKRI-${tag}-${sanitizeFilenamePart(invoice.number)}-${sanitizeFilenamePart(invoice.client.name)}`;
    await exportElementToPdf(previewRef.current, name, "portrait");
  };
  const doPrint = () => { if (previewRef.current) printElement(previewRef.current); };

  const addItem = () => patch({ items: [...invoice.items, emptyServiceItem()] });
  const duplicateItem = (id: string) => {
    const item = invoice.items.find(i => i.id === id); if (!item) return;
    const copy = { ...item, id: uid() };
    patch({ items: [...invoice.items, copy] });
  };
  const removeItem = (id: string) => patch({ items: invoice.items.filter(i => i.id !== id) });
  const updateItem = (next: any) => patch({ items: invoice.items.map(i => i.id === next.id ? next : i) });

  const pickClient = (c: Client | null) => {
    if (!c) return;
    setInvoice(v => ({ ...v, clientId: c.id, client: { ...c } }));
  };
  const saveClientToDb = () => {
    if (!invoice.client.name.trim()) { toast.error("Client name required"); return; }
    let savedId = invoice.clientId;
    setClients(prev => {
      const exists = prev.find(c => c.name.toLowerCase() === invoice.client.name.toLowerCase());
      if (exists) {
        savedId = exists.id;
        return prev.map(c => c.id === exists.id ? { ...c, ...invoice.client, id: c.id } : c);
      }
      const fresh = { ...invoice.client, id: uid() };
      savedId = fresh.id;
      return [fresh, ...prev];
    });
    setInvoice(v => ({ ...v, clientId: savedId }));
    toast.success("Client saved to database");
  };

  return (
    <div className="flex flex-col xl:flex-row min-h-[calc(100vh-3.5rem)]">
      <section className="xl:w-[640px] xl:border-r p-4 space-y-3 overflow-y-auto">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold">{invoices.some(i => i.id === invoice.id) ? "Edit" : "New"} Invoice</h1>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={duplicate}><Copy />Duplicate</Button>
            <Button size="sm" variant="outline" onClick={remove} className="text-destructive"><Trash2 /></Button>
            <Button size="sm" onClick={save} className="bg-navy text-navy-foreground"><Save />Save</Button>
          </div>
        </div>

        <Tabs defaultValue="details">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="client">Client</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card><CardContent className="pt-5 grid grid-cols-2 gap-3">
              <Field label="Invoice number"><Input value={invoice.number} onChange={e => patch({ number: e.target.value })} /></Field>
              <Field label="Booking ref"><Input value={invoice.bookingRef} onChange={e => patch({ bookingRef: e.target.value })} /></Field>
              <Field label="Date"><Input type="date" value={invoice.date} onChange={e => patch({ date: e.target.value })} /></Field>
              <Field label="Due date"><Input type="date" value={invoice.dueDate} onChange={e => patch({ dueDate: e.target.value })} /></Field>
              <Field label="Status">
                <Select value={invoice.status} onValueChange={(v) => patch({ status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Unpaid","Paid","Partial","Cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Currency">
                <Select value={invoice.currency} onValueChange={(v) => patch({ currency: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["USD","EUR","EGP","SAR","AED"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="client">
            <Card><CardContent className="pt-5 space-y-3">
              <Field label="Select existing client">
                <PickerCombo items={clients} value={clients.find(c => c.name === invoice.client.name)?.id} onPick={pickClient} placeholder="Pick from database…" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Client / agency name" className="col-span-2"><Input value={invoice.client.name} onChange={e => patchClient({ name: e.target.value })} /></Field>
                <Field label="Email"><Input value={invoice.client.email} onChange={e => patchClient({ email: e.target.value })} /></Field>
                <Field label="Phone"><Input value={invoice.client.phone} onChange={e => patchClient({ phone: e.target.value })} /></Field>
                <Field label="Tax ID"><Input value={invoice.client.taxId} onChange={e => patchClient({ taxId: e.target.value })} /></Field>
                <Field label="Address" className="col-span-2"><Textarea rows={2} value={invoice.client.address} onChange={e => patchClient({ address: e.target.value })} /></Field>
              </div>
              <Button size="sm" variant="outline" onClick={saveClientToDb}>Save to client database</Button>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-3">
            {invoice.items.map((it, i) => (
              <ServiceItemForm
                key={it.id} item={it} index={i} currency={invoice.currency}
                onChange={updateItem}
                onRemove={() => removeItem(it.id)}
                onDuplicate={() => duplicateItem(it.id)}
              />
            ))}
            <Button onClick={addItem} variant="outline" className="w-full border-dashed"><Plus />Add Service</Button>
          </TabsContent>

          <TabsContent value="payment">
            <Card><CardContent className="pt-5 grid grid-cols-2 gap-3">
              <Field label="VAT %"><Input type="number" min={0} step="0.01" value={invoice.vatPercent} onChange={e => patch({ vatPercent: Number(e.target.value) })} /></Field>
              <Field label="Discount type">
                <Select value={invoice.discountType} onValueChange={(v) => patch({ discountType: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amount">Fixed amount</SelectItem>
                    <SelectItem value="percent">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Discount value"><Input type="number" min={0} step="0.01" value={invoice.discountValue} onChange={e => patch({ discountValue: Number(e.target.value) })} /></Field>
              <Field label="Paid amount"><Input type="number" min={0} step="0.01" value={invoice.paidAmount} onChange={e => patch({ paidAmount: Number(e.target.value) })} /></Field>
              <Field label="Override grand total (optional)" className="col-span-2">
                <Input type="number" step="0.01" value={invoice.totalOverride ?? ""} onChange={e => patch({ totalOverride: e.target.value === "" ? null : Number(e.target.value) })} placeholder="Leave empty to auto-calculate" />
              </Field>
              <div className="col-span-2 rounded border bg-muted p-3 text-sm space-y-1">
                <Row label="Subtotal" value={formatMoney(totals.subtotal, invoice.currency)} />
                {totals.discount > 0 && <Row label="Discount" value={`− ${formatMoney(totals.discount, invoice.currency)}`} />}
                {invoice.vatPercent > 0 && <Row label={`VAT (${invoice.vatPercent}%)`} value={formatMoney(totals.vat, invoice.currency)} />}
                <Row strong label="Grand total" value={formatMoney(totals.grandTotal, invoice.currency)} />
                <Row label="Balance due" value={formatMoney(totals.balance, invoice.currency)} />
              </div>
              <div className="col-span-2 pt-2 border-t">
                <div className="text-sm font-semibold mb-2">Bank / payment details</div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Bank name"><Input value={invoice.payment.bankName} onChange={e => patch({ payment: { ...invoice.payment, bankName: e.target.value } })} /></Field>
                  <Field label="Account number"><Input value={invoice.payment.accountNumber} onChange={e => patch({ payment: { ...invoice.payment, accountNumber: e.target.value } })} /></Field>
                  <Field label="IBAN"><Input value={invoice.payment.iban} onChange={e => patch({ payment: { ...invoice.payment, iban: e.target.value } })} /></Field>
                  <Field label="SWIFT"><Input value={invoice.payment.swift} onChange={e => patch({ payment: { ...invoice.payment, swift: e.target.value } })} /></Field>
                  <Field label="Payment notes" className="col-span-2"><Textarea rows={2} value={invoice.payment.notes} onChange={e => patch({ payment: { ...invoice.payment, notes: e.target.value } })} /></Field>
                </div>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => patch({ payment: settings.defaultBank })}>Use company default</Button>
              </div>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card><CardContent className="pt-5">
              <Field label="Notes (printed on invoice)">
                <Textarea rows={6} value={invoice.notes} onChange={e => patch({ notes: e.target.value })} />
              </Field>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </section>

      <section className="flex-1 bg-muted/30 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b px-4 py-2 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium">Live preview</div>
            <LanguageToggle lang={lang} onChange={setLang} />
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline" title="Balance Due Invoice (payment request for remaining balance)">
              <Link to="/invoices/$id/balance-due" params={{ id: invoice.id }}><Receipt />Balance Due Invoice</Link>
            </Button>
            <Button size="sm" variant="outline" onClick={doPrint}><Printer />Print</Button>
            <Button size="sm" onClick={downloadPdf} className="bg-navy text-navy-foreground"><Download />Download PDF</Button>
          </div>
        </div>
        <div className="p-6 flex justify-center">
          <div ref={previewRef}>
            <InvoicePreview invoice={invoice} lang={lang} />
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-bold text-base doc-navy pt-1 border-t" : ""}`}>
      <span className="text-muted-foreground">{label}</span><span>{value}</span>
    </div>
  );
}

export function buildBlankInvoice(opts: { number: string; defaults: any }): Invoice {
  const today = new Date().toISOString().slice(0, 10);
  const due = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  return {
    id: uid(),
    kind: "invoice",
    number: opts.number,
    bookingRef: "",
    date: today,
    dueDate: due,
    status: "Unpaid",
    currency: opts.defaults.defaultCurrency,
    client: emptyClient(),
    items: [emptyServiceItem("hotel")].map(i => ({ ...i, total: computeItemTotal(i) })),
    notes: "",
    payment: { ...opts.defaults.defaultBank },
    vatPercent: 0,
    discountType: "amount",
    discountValue: 0,
    paidAmount: 0,
    totalOverride: null,
    createdAt: new Date().toISOString(),
  };
}
