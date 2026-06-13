import { Trash2, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SERVICE_TYPES, type ServiceItem } from "@/lib/storage";
import { computeItemTotal, formatMoney } from "@/lib/format";
import { ServiceDynamicFields } from "./ServiceFields";
import type { Currency } from "@/lib/storage";

export function ServiceItemForm({
  item, index, currency, onChange, onRemove, onDuplicate,
}: {
  item: ServiceItem;
  index: number;
  currency: Currency;
  onChange: (next: ServiceItem) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const patch = (p: Partial<ServiceItem>) => {
    const next = { ...item, ...p };
    next.total = computeItemTotal(next);
    onChange(next);
  };
  const metaPatch = (mp: Record<string, any>) => {
    const next = { ...item, meta: { ...item.meta, ...mp } };
    next.total = computeItemTotal(next);
    onChange(next);
  };

  return (
    <Card className="border-l-4 border-l-navy">
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="size-7 inline-flex items-center justify-center rounded-full bg-navy text-navy-foreground text-xs font-semibold">{index + 1}</span>
            <span className="text-sm font-semibold">Service item</span>
          </div>
          <div className="flex gap-1">
            <Button type="button" variant="outline" size="sm" onClick={onDuplicate}><Copy className="size-3.5" />Duplicate</Button>
            <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-destructive hover:text-destructive"><Trash2 className="size-3.5" /></Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2 space-y-1">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Service type</Label>
            <Select value={item.type} onValueChange={(v) => patch({ type: v as any, meta: {} })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SERVICE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Description</Label>
            <Input value={item.description} onChange={(e) => patch({ description: e.target.value })} placeholder="Short service description" />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Passenger / guest</Label>
            <Input value={item.passengerName} onChange={(e) => patch({ passengerName: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Booking ref</Label>
            <Input value={item.bookingRef} onChange={(e) => patch({ bookingRef: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Supplier ref</Label>
            <Input value={item.supplierRef} onChange={(e) => patch({ supplierRef: e.target.value })} />
          </div>
        </div>

        <ServiceDynamicFields item={item} onChange={patch} onMeta={metaPatch} />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t">
          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Qty</Label>
            <Input type="number" min={1} value={item.quantity} onChange={(e) => patch({ quantity: Number(e.target.value) })} />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Unit</Label>
            <Input value={item.unit} onChange={(e) => patch({ unit: e.target.value })} placeholder="night / pax / pcs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Unit price</Label>
            <Input type="number" min={0} step="0.01" value={item.unitPrice} onChange={(e) => patch({ unitPrice: Number(e.target.value) })} />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Total (auto)</Label>
            <div className="flex items-center gap-2">
              <Input type="number" min={0} step="0.01" value={item.total} onChange={(e) => patch({ total: Number(e.target.value) })} className="font-semibold" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">{formatMoney(item.total || 0, currency)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Notes</Label>
          <Textarea rows={2} value={item.notes} onChange={(e) => patch({ notes: e.target.value })} />
        </div>
      </CardContent>
    </Card>
  );
}
