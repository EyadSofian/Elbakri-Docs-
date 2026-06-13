import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  type Payment,
  type PaymentMethod,
  type Client,
  type Currency,
  PAYMENT_METHODS,
  nextPaymentNumberAsync,
  uid,
  usePayments,
} from "@/lib/storage";
import type { InvoiceWithPayments } from "@/lib/account";
import { formatDate, formatMoney } from "@/lib/format";

function round2(n: number) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function PaymentDialog({
  open,
  onOpenChange,
  client,
  currency,
  invoices,
  presetInvoiceId,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  client: Client;
  currency: Currency;
  invoices: InvoiceWithPayments[];
  presetInvoiceId?: string;
}) {
  const [, setPayments] = usePayments();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  // Per-invoice amount applied
  const [apply, setApply] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const dueInvoices = useMemo(
    () =>
      invoices
        .filter((r) => r.remaining > 0.0001 && r.invoice.status !== "Cancelled")
        .sort((a, b) =>
          (a.invoice.dueDate || a.invoice.date || "").localeCompare(
            b.invoice.dueDate || b.invoice.date || "",
          ),
        ),
    [invoices],
  );

  useEffect(() => {
    if (!open) return;
    setDate(new Date().toISOString().slice(0, 10));
    setAmount(0);
    setReference("");
    setNotes("");
    setApply({});
    setSelected(new Set(presetInvoiceId ? [presetInvoiceId] : []));
  }, [open, presetInvoiceId]);

  const allocateAuto = () => {
    let left = round2(amount);
    const next: Record<string, number> = {};
    const sel = new Set<string>();
    for (const r of dueInvoices) {
      if (left <= 0) break;
      const take = Math.min(r.remaining, left);
      if (take > 0) {
        next[r.invoice.id] = round2(take);
        left = round2(left - take);
        sel.add(r.invoice.id);
      }
    }
    setApply(next);
    setSelected(sel);
  };
  const allocateSelected = () => {
    let left = round2(amount);
    const next: Record<string, number> = {};
    for (const r of dueInvoices) {
      if (!selected.has(r.invoice.id)) continue;
      if (left <= 0) break;
      const take = Math.min(r.remaining, left);
      if (take > 0) {
        next[r.invoice.id] = round2(take);
        left = round2(left - take);
      }
    }
    setApply(next);
  };
  const clearAlloc = () => {
    setApply({});
    setSelected(new Set());
  };

  const totalApplied = useMemo(
    () => Object.values(apply).reduce((s, v) => s + (Number(v) || 0), 0),
    [apply],
  );
  const credit = Math.max(0, round2(amount - totalApplied));
  const overApplied = totalApplied - amount > 0.001;

  const submit = async () => {
    if (!amount || amount <= 0) {
      toast.error("Enter an amount");
      return;
    }
    if (!client.id) {
      toast.error("Client not saved");
      return;
    }
    if (overApplied) {
      toast.error("Applied amount exceeds payment amount");
      return;
    }
    // validate per-invoice apply not exceeding remaining
    for (const r of dueInvoices) {
      const a = Number(apply[r.invoice.id]) || 0;
      if (a > r.remaining + 0.001) {
        toast.error(`Apply for ${r.invoice.number} exceeds its balance`);
        return;
      }
    }
    const allocations = Object.entries(apply)
      .map(([invoiceId, amt]) => ({ invoiceId, amount: round2(amt) }))
      .filter((a) => a.amount > 0);
    const p: Payment = {
      id: uid(),
      number: await nextPaymentNumberAsync(),
      clientId: client.id,
      date,
      amount: round2(amount),
      method,
      reference,
      notes,
      currency,
      allocations,
      createdAt: new Date().toISOString(),
    };
    setPayments((prev) => [p, ...prev]);
    toast.success(
      `Payment ${p.number} recorded${credit > 0 ? ` · ${formatMoney(credit, currency)} added to client credit` : ""}`,
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Payment · {client.name}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3">
          <F label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </F>
          <F label={`Amount (${currency})`}>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </F>
          <F label="Method">
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>
          <F label="Reference" className="col-span-2">
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Bank ref / cheque #"
            />
          </F>
          <F label="Notes">
            <Textarea rows={1} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </F>
        </div>

        <div className="flex items-center justify-between mt-2 mb-1">
          <div className="text-sm font-semibold">Allocation</div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={allocateAuto} disabled={!amount}>
              Auto: oldest first
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={allocateSelected}
              disabled={!amount || selected.size === 0}
            >
              Allocate to selected
            </Button>
            <Button size="sm" variant="ghost" onClick={clearAlloc}>
              Clear / advance only
            </Button>
          </div>
        </div>

        <div className="border rounded max-h-72 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 sticky top-0">
              <tr className="text-left">
                <th className="p-2 w-8"></th>
                <th className="p-2">Invoice</th>
                <th className="p-2">Date</th>
                <th className="p-2">Due</th>
                <th className="p-2 text-right">Total</th>
                <th className="p-2 text-right">Paid</th>
                <th className="p-2 text-right">Remaining</th>
                <th className="p-2 text-right w-28">Apply</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {dueInvoices.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-muted-foreground p-4">
                    No invoices with balance.
                  </td>
                </tr>
              )}
              {dueInvoices.map((r) => (
                <tr key={r.invoice.id} className="border-t">
                  <td className="p-2">
                    <Checkbox
                      checked={selected.has(r.invoice.id)}
                      onCheckedChange={(c) => {
                        const s = new Set(selected);
                        if (c) s.add(r.invoice.id);
                        else {
                          s.delete(r.invoice.id);
                          setApply((a) => {
                            const n = { ...a };
                            delete n[r.invoice.id];
                            return n;
                          });
                        }
                        setSelected(s);
                      }}
                    />
                  </td>
                  <td className="p-2 font-medium">{r.invoice.number}</td>
                  <td className="p-2">{formatDate(r.invoice.date)}</td>
                  <td className="p-2">{formatDate(r.invoice.dueDate)}</td>
                  <td className="p-2 text-right">{formatMoney(r.grandTotal, currency)}</td>
                  <td className="p-2 text-right">{formatMoney(r.paidAmount, currency)}</td>
                  <td className="p-2 text-right font-semibold">
                    {formatMoney(r.remaining, currency)}
                  </td>
                  <td className="p-2 text-right">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={apply[r.invoice.id] ?? ""}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 0;
                        setApply((a) => ({ ...a, [r.invoice.id]: v }));
                        if (v > 0)
                          setSelected((s) => {
                            const n = new Set(s);
                            n.add(r.invoice.id);
                            return n;
                          });
                      }}
                      className="h-7 text-right"
                    />
                  </td>
                  <td className="p-2">{r.effectiveStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs mt-2">
          <Stat
            label="Applied"
            value={formatMoney(totalApplied, currency)}
            tone={overApplied ? "warn" : undefined}
          />
          <Stat
            label="Unapplied → Client Credit"
            value={formatMoney(credit, currency)}
            tone={credit > 0 ? "ok" : undefined}
          />
          <Stat label="Payment Amount" value={formatMoney(amount, currency)} />
        </div>
        {overApplied && (
          <div className="text-xs text-destructive">
            Applied amount cannot exceed payment amount.
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} className="bg-navy text-navy-foreground">
            Save payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function F({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" | "ok" }) {
  return (
    <div
      className={`border rounded p-2 ${tone === "warn" ? "border-destructive bg-destructive/10" : tone === "ok" ? "border-emerald-300 bg-emerald-50" : ""}`}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  );
}
