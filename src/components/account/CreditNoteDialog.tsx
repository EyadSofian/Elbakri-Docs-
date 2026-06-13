import { useEffect, useState } from "react";
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
import { toast } from "sonner";
import {
  type Client,
  type Currency,
  type CreditNote,
  type CreditNoteReason,
  CREDIT_NOTE_REASONS,
  nextCreditNoteNumberAsync,
  uid,
  useCreditNotes,
} from "@/lib/storage";
import type { InvoiceWithPayments } from "@/lib/account";
import { formatMoney } from "@/lib/format";

const REASON_LABELS: Record<CreditNoteReason, string> = {
  discount: "Discount",
  cancelled_service: "Cancelled service",
  price_correction: "Price correction",
  refund_adjustment: "Refund adjustment",
  supplier_issue: "Supplier issue",
  manual_adjustment: "Manual adjustment",
  other: "Other",
};

export function CreditNoteDialog({
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
  const [, setCN] = useCreditNotes();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState<CreditNoteReason>("discount");
  const [invoiceId, setInvoiceId] = useState<string>(presetInvoiceId || "");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setDate(new Date().toISOString().slice(0, 10));
    setAmount(0);
    setReason("discount");
    setNotes("");
    setInvoiceId(presetInvoiceId || "");
  }, [open, presetInvoiceId]);

  const submit = async () => {
    if (!amount || amount <= 0) {
      toast.error("Enter an amount");
      return;
    }
    const inv = invoices.find((r) => r.invoice.id === invoiceId);
    if (inv && amount > inv.remaining + 0.001) {
      toast.error(`Amount exceeds invoice remaining (${formatMoney(inv.remaining, currency)})`);
      return;
    }
    const cn: CreditNote = {
      id: uid(),
      number: await nextCreditNoteNumberAsync(),
      clientId: client.id,
      date,
      currency,
      amount,
      reason,
      invoiceId: invoiceId || undefined,
      notes,
      createdAt: new Date().toISOString(),
    };
    setCN((prev) => [cn, ...prev]);
    toast.success(`Credit note ${cn.number} issued`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Issue Credit Note · {client.name}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
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
          <F label="Reason">
            <Select value={reason} onValueChange={(v) => setReason(v as CreditNoteReason)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CREDIT_NOTE_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {REASON_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>
          <F label="Related invoice (optional)">
            <Select
              value={invoiceId || "_none"}
              onValueChange={(v) => setInvoiceId(v === "_none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">— None (general credit) —</SelectItem>
                {invoices
                  .filter((r) => r.invoice.status !== "Cancelled")
                  .map((r) => (
                    <SelectItem key={r.invoice.id} value={r.invoice.id}>
                      {r.invoice.number} · bal {formatMoney(r.remaining, currency)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </F>
          <F label="Notes" className="col-span-2">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </F>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} className="bg-navy text-navy-foreground">
            Issue credit note
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
