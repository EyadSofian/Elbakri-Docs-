import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Download, Printer, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { SERVICE_TYPES, useVouchers, useSuppliers, uid, type Voucher, type Supplier } from "@/lib/storage";
import { VoucherPreview } from "@/components/doc/VoucherPreview";
import { PickerCombo } from "@/components/doc/PickerCombo";
import { exportElementToPdf, printElement, sanitizeFilenamePart } from "@/lib/pdf";
import { LanguageToggle } from "@/components/doc/LanguageToggle";
import type { Lang } from "@/lib/i18n";

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function VoucherEditor({ initial }: { initial: Voucher }) {
  const [voucher, setVoucher] = useState<Voucher>(initial);
  const [vouchers, setVouchers] = useVouchers();
  const [suppliers, setSuppliers] = useSuppliers();
  const [lang, setLang] = useState<Lang>("en");
  const previewRef = useRef<HTMLDivElement>(null);
  const nav = useNavigate();

  const patch = (p: Partial<Voucher>) => setVoucher(v => ({ ...v, ...p }));

  const save = () => {
    setVouchers(prev => {
      const ix = prev.findIndex(p => p.id === voucher.id);
      if (ix === -1) return [voucher, ...prev];
      const next = [...prev]; next[ix] = voucher; return next;
    });
    toast.success("Voucher saved");
  };
  const remove = () => {
    if (!confirm("Delete this voucher?")) return;
    setVouchers(prev => prev.filter(p => p.id !== voucher.id));
    nav({ to: "/documents" });
  };
  const duplicate = () => {
    const dup = { ...voucher, id: uid(), number: voucher.number + "-COPY", createdAt: new Date().toISOString() };
    setVouchers(prev => [dup, ...prev]);
    nav({ to: "/vouchers/$id", params: { id: dup.id } });
  };
  const download = async () => {
    save();
    if (!previewRef.current) return;
    const name = `ELBAKRI-VOUCHER-${sanitizeFilenamePart(voucher.number)}-${sanitizeFilenamePart(voucher.leaderGuest || voucher.guestNames)}`;
    await exportElementToPdf(previewRef.current, name, "portrait");
  };
  const doPrint = () => { if (previewRef.current) printElement(previewRef.current); };

  const pickSupplier = (s: Supplier | null) => {
    if (!s) return;
    patch({ providerName: s.name, address: s.address, telFax: s.phone });
  };
  const saveSupplierToDb = () => {
    if (!voucher.providerName.trim()) return toast.error("Provider name required");
    setSuppliers(prev => {
      const exists = prev.find(s => s.name.toLowerCase() === voucher.providerName.toLowerCase());
      const data: Supplier = { id: exists?.id || uid(), name: voucher.providerName, address: voucher.address, phone: voucher.telFax, email: "", notes: "" };
      if (exists) return prev.map(s => s.id === exists.id ? data : s);
      return [data, ...prev];
    });
    toast.success("Supplier saved");
  };

  return (
    <div className="flex flex-col xl:flex-row min-h-[calc(100vh-3.5rem)]">
      <section className="xl:w-[640px] xl:border-r p-4 space-y-3 overflow-y-auto">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold">{vouchers.some(v => v.id === voucher.id) ? "Edit" : "New"} Voucher</h1>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={duplicate}><Copy />Duplicate</Button>
            <Button size="sm" variant="outline" onClick={remove} className="text-destructive"><Trash2 /></Button>
            <Button size="sm" onClick={save} className="bg-navy text-navy-foreground"><Save />Save</Button>
          </div>
        </div>

        <Tabs defaultValue="details">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="provider">Provider</TabsTrigger>
            <TabsTrigger value="guests">Guests</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card><CardContent className="pt-5 grid grid-cols-2 gap-3">
              <Field label="Voucher number"><Input value={voucher.number} onChange={e => patch({ number: e.target.value })} /></Field>
              <Field label="Date"><Input type="date" value={voucher.date} onChange={e => patch({ date: e.target.value })} /></Field>
              <Field label="Service type">
                <Select value={voucher.serviceType} onValueChange={(v) => patch({ serviceType: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SERVICE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Service booking ref"><Input value={voucher.serviceBookingRef} onChange={e => patch({ serviceBookingRef: e.target.value })} /></Field>
              <Field label="Multiple booking ref"><Input value={voucher.multipleBookingRef} onChange={e => patch({ multipleBookingRef: e.target.value })} /></Field>
              <Field label="Confirmation number"><Input value={voucher.confirmationNumber} onChange={e => patch({ confirmationNumber: e.target.value })} /></Field>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="provider">
            <Card><CardContent className="pt-5 space-y-3">
              <Field label="Select existing supplier">
                <PickerCombo items={suppliers} onPick={pickSupplier} placeholder="Pick supplier…" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Provider / hotel name" className="col-span-2"><Input value={voucher.providerName} onChange={e => patch({ providerName: e.target.value })} /></Field>
                <Field label="Hotel rating">
                  <Select value={String(voucher.hotelRating || 0)} onValueChange={(v) => patch({ hotelRating: Number(v) })}>
                    <SelectTrigger><SelectValue placeholder="Stars" /></SelectTrigger>
                    <SelectContent>{[0,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n ? `${n} Stars` : "N/A"}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Tel / Fax"><Input value={voucher.telFax} onChange={e => patch({ telFax: e.target.value })} /></Field>
                <Field label="Address" className="col-span-2"><Textarea rows={2} value={voucher.address} onChange={e => patch({ address: e.target.value })} /></Field>
              </div>
              <Button size="sm" variant="outline" onClick={saveSupplierToDb}>Save to supplier database</Button>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="guests">
            <Card><CardContent className="pt-5 grid grid-cols-2 gap-3">
              <Field label="Guest names" className="col-span-2"><Textarea rows={3} value={voucher.guestNames} onChange={e => patch({ guestNames: e.target.value })} placeholder="One per line" /></Field>
              <Field label="Leader guest" className="col-span-2"><Input value={voucher.leaderGuest} onChange={e => patch({ leaderGuest: e.target.value })} /></Field>
              <Field label="Room type"><Input value={voucher.roomType} onChange={e => patch({ roomType: e.target.value })} /></Field>
              <Field label="Rooms"><Input type="number" min={1} value={voucher.numberOfRooms} onChange={e => patch({ numberOfRooms: Number(e.target.value) })} /></Field>
              <Field label="Adults"><Input type="number" min={1} value={voucher.adults} onChange={e => patch({ adults: Number(e.target.value) })} /></Field>
              <Field label="Children"><Input type="number" min={0} value={voucher.children} onChange={e => patch({ children: Number(e.target.value) })} /></Field>
              <Field label="Check-in"><Input type="date" value={voucher.checkIn} onChange={e => patch({ checkIn: e.target.value })} /></Field>
              <Field label="Check-out"><Input type="date" value={voucher.checkOut} onChange={e => patch({ checkOut: e.target.value })} /></Field>
              <Field label="Rate basis" className="col-span-2">
                <Select value={voucher.rateBasis} onValueChange={(v) => patch({ rateBasis: v })}>
                  <SelectTrigger><SelectValue placeholder="Board" /></SelectTrigger>
                  <SelectContent>{["Room Only","Bed & Breakfast","Half Board","Full Board","All Inclusive"].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Special remarks" className="col-span-2"><Textarea rows={3} value={voucher.remarks} onChange={e => patch({ remarks: e.target.value })} /></Field>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="policies">
            <Card><CardContent className="pt-5 grid grid-cols-1 gap-3">
              <Field label="Check-in / out times"><Input value={voucher.checkInOutTimes} onChange={e => patch({ checkInOutTimes: e.target.value })} placeholder="e.g. Check-in 14:00, Check-out 12:00" /></Field>
              <Field label="Check-in restrictions"><Textarea rows={2} value={voucher.checkInRestrictions} onChange={e => patch({ checkInRestrictions: e.target.value })} /></Field>
              <Field label="Age requirements"><Input value={voucher.ageRequirements} onChange={e => patch({ ageRequirements: e.target.value })} /></Field>
              <Field label="Pets policy"><Input value={voucher.petsPolicy} onChange={e => patch({ petsPolicy: e.target.value })} /></Field>
              <Field label="Front desk notes"><Textarea rows={2} value={voucher.frontDeskNotes} onChange={e => patch({ frontDeskNotes: e.target.value })} /></Field>
              <Field label="Identification requirements"><Textarea rows={2} value={voucher.identificationRequirements} onChange={e => patch({ identificationRequirements: e.target.value })} /></Field>
              <Field label="Children & extra bed policy"><Textarea rows={2} value={voucher.childrenExtraBedPolicy} onChange={e => patch({ childrenExtraBedPolicy: e.target.value })} /></Field>
              <Field label="Dining notes"><Textarea rows={2} value={voucher.diningNotes} onChange={e => patch({ diningNotes: e.target.value })} /></Field>
              <Field label="Final terms paragraph"><Textarea rows={3} value={voucher.finalTerms} onChange={e => patch({ finalTerms: e.target.value })} placeholder="Default text will print if empty." /></Field>
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
            <Button size="sm" variant="outline" onClick={doPrint}><Printer />Print</Button>
            <Button size="sm" onClick={download} className="bg-navy text-navy-foreground"><Download />Download PDF</Button>
          </div>
        </div>
        <div className="p-6 flex justify-center">
          <div ref={previewRef}><VoucherPreview voucher={voucher} lang={lang} /></div>
        </div>
      </section>
    </div>
  );
}

export function buildBlankVoucher(opts: { number: string }): Voucher {
  return {
    id: uid(), kind: "voucher",
    number: opts.number,
    date: new Date().toISOString().slice(0, 10),
    serviceType: "hotel",
    providerName: "",
    hotelRating: 0,
    address: "",
    telFax: "",
    serviceBookingRef: "",
    multipleBookingRef: "",
    confirmationNumber: "",
    guestNames: "",
    leaderGuest: "",
    numberOfRooms: 1,
    roomType: "",
    adults: 2,
    children: 0,
    checkIn: "",
    checkOut: "",
    rateBasis: "Bed & Breakfast",
    remarks: "",
    checkInRestrictions: "",
    ageRequirements: "",
    petsPolicy: "",
    frontDeskNotes: "",
    identificationRequirements: "Government-issued photo ID and credit card required at check-in.",
    childrenExtraBedPolicy: "",
    diningNotes: "",
    checkInOutTimes: "Check-in from 14:00 · Check-out by 12:00",
    finalTerms: "",
    createdAt: new Date().toISOString(),
  };
}
