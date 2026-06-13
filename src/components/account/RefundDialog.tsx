import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  type Client, type Currency, type Refund, type PaymentMethod,
  PAYMENT_METHODS, nextRefundNumber, uid, useRefunds,
} from "@/lib/storage";

export function RefundDialog({
  open, onOpenChange, client, currency,
}: { open: boolean; onOpenChange: (b: boolean) => void; client: Client; currency: Currency; }) {
  const [, setRF] = useRefunds();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setDate(new Date().toISOString().slice(0, 10));
    setAmount(0); setMethod("bank_transfer"); setReference(""); setNotes("");
  }, [open]);

  const submit = () => {
    if (!amount || amount <= 0) { toast.error("Enter an amount"); return; }
    const r: Refund = {
      id: uid(), number: nextRefundNumber(), clientId: client.id,
      date, currency, amount, method, reference, notes,
      createdAt: new Date().toISOString(),
    };
    setRF(prev => [r, ...prev]);
    toast.success(`Refund ${r.number} recorded`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Issue Refund · {client.name}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <F label="Date"><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></F>
          <F label={`Amount (${currency})`}>
            <Input type="number" min={0} step="0.01" value={amount} onChange={e => setAmount(Number(e.target.value))} />
          </F>
          <F label="Method">
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </F>
          <F label="Reference"><Input value={reference} onChange={e => setReference(e.target.value)} /></F>
          <F label="Notes" className="col-span-2"><Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} /></F>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} className="bg-navy text-navy-foreground">Record refund</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function F({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1 ${className}`}><Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>{children}</div>;
}
