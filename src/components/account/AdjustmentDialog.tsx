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
  type ManualAdjustment,
  nextAdjustmentNumberAsync,
  uid,
  useAdjustments,
} from "@/lib/storage";

export function AdjustmentDialog({
  open,
  onOpenChange,
  client,
  currency,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  client: Client;
  currency: Currency;
}) {
  const [, setADJ] = useAdjustments();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<number>(0);
  const [direction, setDirection] = useState<"debit" | "credit">("debit");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setDate(new Date().toISOString().slice(0, 10));
    setAmount(0);
    setDirection("debit");
    setReason("");
    setNotes("");
  }, [open]);

  const submit = async () => {
    if (!amount || amount <= 0) {
      toast.error("Enter an amount");
      return;
    }
    const a: ManualAdjustment = {
      id: uid(),
      number: await nextAdjustmentNumberAsync(),
      clientId: client.id,
      date,
      currency,
      amount,
      direction,
      reason,
      notes,
      createdAt: new Date().toISOString(),
    };
    setADJ((prev) => [a, ...prev]);
    toast.success(`Adjustment ${a.number} recorded`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Manual Adjustment · {client.name}</DialogTitle>
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
          <F label="Direction">
            <Select value={direction} onValueChange={(v) => setDirection(v as "debit" | "credit")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debit">Debit (increases balance)</SelectItem>
                <SelectItem value="credit">Credit (decreases balance)</SelectItem>
              </SelectContent>
            </Select>
          </F>
          <F label="Reason">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
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
            Save adjustment
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
