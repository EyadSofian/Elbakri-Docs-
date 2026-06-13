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
  type DebitNote,
  type DebitNoteReason,
  DEBIT_NOTE_REASONS,
  nextDebitNoteNumberAsync,
  uid,
  useDebitNotes,
} from "@/lib/storage";
import type { InvoiceWithPayments } from "@/lib/account";

const REASON_LABELS: Record<DebitNoteReason, string> = {
  extra_charge: "Extra charge",
  price_correction: "Price correction",
  penalty: "Penalty / fee",
  service_addition: "Additional service",
  manual_adjustment: "Manual adjustment",
  other: "Other",
};

export function DebitNoteDialog({
  open,
  onOpenChange,
  client,
  currency,
  invoices,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  client: Client;
  currency: Currency;
  invoices: InvoiceWithPayments[];
}) {
  const [, setDN] = useDebitNotes();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState<DebitNoteReason>("extra_charge");
  const [invoiceId, setInvoiceId] = useState<string>("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setDate(new Date().toISOString().slice(0, 10));
    setAmount(0);
    setReason("extra_charge");
    setNotes("");
    setInvoiceId("");
  }, [open]);

  const submit = async () => {
    if (!amount || amount <= 0) {
      toast.error("Enter an amount");
      return;
    }
    const dn: DebitNote = {
      id: uid(),
      number: await nextDebitNoteNumberAsync(),
      clientId: client.id,
      date,
      currency,
      amount,
      reason,
      invoiceId: invoiceId || undefined,
      notes,
      createdAt: new Date().toISOString(),
    };
    setDN((prev) => [dn, ...prev]);
    toast.success(`Debit note ${dn.number} issued`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Issue Debit Note · {client.name}</DialogTitle>
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
            <Select value={reason} onValueChange={(v) => setReason(v as DebitNoteReason)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEBIT_NOTE_REASONS.map((r) => (
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
                <SelectItem value="_none">— None —</SelectItem>
                {invoices
                  .filter((r) => r.invoice.status !== "Cancelled")
                  .map((r) => (
                    <SelectItem key={r.invoice.id} value={r.invoice.id}>
                      {r.invoice.number}
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
            Issue debit note
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
