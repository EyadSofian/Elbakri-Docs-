import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { type Client, type Currency, useClients } from "@/lib/storage";

const CURRENCIES: Currency[] = ["USD", "EUR", "EGP", "SAR", "AED"];

export function OpeningBalanceDialog({
  open, onOpenChange, client, currency,
}: { open: boolean; onOpenChange: (b: boolean) => void; client: Client; currency: Currency; }) {
  const [, setClients] = useClients();
  const [amount, setAmount] = useState<number>(client.openingBalance || 0);
  const [date, setDate] = useState<string>(client.openingBalanceDate || new Date().toISOString().slice(0, 10));
  const [cur, setCur] = useState<Currency>(client.openingBalanceCurrency || currency);

  useEffect(() => {
    if (!open) return;
    setAmount(client.openingBalance || 0);
    setDate(client.openingBalanceDate || new Date().toISOString().slice(0, 10));
    setCur(client.openingBalanceCurrency || currency);
  }, [open, client, currency]);

  const submit = () => {
    setClients(prev => prev.map(c => c.id === client.id
      ? { ...c, openingBalance: amount, openingBalanceDate: date, openingBalanceCurrency: cur }
      : c,
    ));
    toast.success("Opening balance saved");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Opening Balance · {client.name}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <F label="As of date"><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></F>
          <F label="Currency">
            <Select value={cur} onValueChange={(v) => setCur(v as Currency)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </F>
          <F label="Amount (positive = Dr, negative = Cr)" className="col-span-2">
            <Input type="number" step="0.01" value={amount} onChange={e => setAmount(Number(e.target.value))} />
          </F>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} className="bg-navy text-navy-foreground">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function F({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1 ${className}`}><Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>{children}</div>;
}
