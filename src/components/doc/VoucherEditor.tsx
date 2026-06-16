import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Download, Printer, Trash2, Copy, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  SERVICE_TYPES,
  emptyServiceItem,
  useVouchers,
  useSuppliers,
  useClients,
  uid,
  type ServiceItem,
  type ServiceType,
  type Voucher,
  type Supplier,
  type Client,
} from "@/lib/storage";
import { VoucherPreview } from "@/components/doc/VoucherPreview";
import { PickerCombo } from "@/components/doc/PickerCombo";
import { exportElementToPdf, printElement, sanitizeFilenamePart } from "@/lib/pdf";
import { LanguageToggle } from "@/components/doc/LanguageToggle";
import { RATE_BASIS, type Lang } from "@/lib/i18n";
import { ServiceDynamicFields } from "@/components/doc/ServiceFields";

function Field({
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

function legacyVoucherService(voucher: Voucher): ServiceItem {
  return {
    ...emptyServiceItem(voucher.serviceType || "hotel"),
    description: voucher.remarks || "",
    passengerName: voucher.leaderGuest || voucher.guestNames || "",
    bookingRef: voucher.serviceBookingRef || "",
    supplierRef: voucher.confirmationNumber || voucher.multipleBookingRef || "",
    startDate: voucher.checkIn || "",
    endDate: voucher.checkOut || "",
    notes: voucher.remarks || "",
    meta: {
      hotelName: voucher.providerName || "",
      rating: voucher.hotelRating || 0,
      address: voucher.address || "",
      roomType: voucher.roomType || "",
      rooms: voucher.numberOfRooms || 1,
      adults: voucher.adults || 2,
      children: voucher.children || 0,
      checkIn: voucher.checkIn || "",
      checkOut: voucher.checkOut || "",
      board: voucher.rateBasis || "",
    },
  };
}

function ensureVoucherServices(voucher: Voucher): Voucher {
  return voucher.items?.length ? voucher : { ...voucher, items: [legacyVoucherService(voucher)] };
}

function primaryServicePatch(item: ServiceItem, current: Voucher): Partial<Voucher> {
  const meta = item.meta || {};
  const patch: Partial<Voucher> = {
    serviceType: item.type,
    serviceBookingRef: item.bookingRef || current.serviceBookingRef,
    confirmationNumber: item.supplierRef || current.confirmationNumber,
    remarks: item.notes || item.description || current.remarks,
  };

  if (item.passengerName) {
    patch.leaderGuest = item.passengerName;
  }

  if (item.type === "hotel") {
    patch.providerName = meta.hotelName || current.providerName;
    patch.hotelRating = Number(meta.rating || current.hotelRating || 0);
    patch.address = meta.address || current.address;
    patch.roomType = meta.roomType || current.roomType;
    patch.numberOfRooms = Number(meta.rooms || current.numberOfRooms || 1);
    patch.adults = Number(meta.adults || current.adults || 2);
    patch.children = Number(meta.children || current.children || 0);
    patch.checkIn = meta.checkIn || current.checkIn;
    patch.checkOut = meta.checkOut || current.checkOut;
    patch.rateBasis = meta.board || current.rateBasis;
  }

  return patch;
}

function VoucherServiceItemForm({
  item,
  index,
  canRemove,
  onChange,
  onRemove,
  onDuplicate,
}: {
  item: ServiceItem;
  index: number;
  canRemove: boolean;
  onChange: (next: ServiceItem) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const patch = (p: Partial<ServiceItem>) => onChange({ ...item, ...p });
  const metaPatch = (mp: Record<string, any>) =>
    onChange({ ...item, meta: { ...(item.meta || {}), ...mp } });

  return (
    <Card className="border-l-4 border-l-navy">
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="size-7 inline-flex items-center justify-center rounded-full bg-navy text-navy-foreground text-xs font-semibold">
              {index + 1}
            </span>
            <span className="text-sm font-semibold">Voucher service</span>
          </div>
          <div className="flex gap-1">
            <Button type="button" variant="outline" size="sm" onClick={onDuplicate}>
              <Copy className="size-3.5" />
              Duplicate
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={!canRemove}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Service type" className="col-span-2">
            <Select
              value={item.type}
              onValueChange={(value) =>
                patch({ type: value as ServiceType, meta: {}, unit: "", unitPrice: 0, total: 0 })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Description" className="col-span-2">
            <Input
              value={item.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="Short service description"
            />
          </Field>
          <Field label="Passenger / guest" className="col-span-2">
            <Input
              value={item.passengerName}
              onChange={(e) => patch({ passengerName: e.target.value })}
            />
          </Field>
          <Field label="Booking ref">
            <Input
              value={item.bookingRef}
              onChange={(e) => patch({ bookingRef: e.target.value })}
            />
          </Field>
          <Field label="Supplier ref">
            <Input
              value={item.supplierRef}
              onChange={(e) => patch({ supplierRef: e.target.value })}
            />
          </Field>
        </div>

        <ServiceDynamicFields item={item} onChange={patch} onMeta={metaPatch} />

        <Field label="Service notes">
          <Textarea
            rows={2}
            value={item.notes}
            onChange={(e) => patch({ notes: e.target.value })}
          />
        </Field>
      </CardContent>
    </Card>
  );
}

export function VoucherEditor({ initial }: { initial: Voucher }) {
  const [voucher, setVoucher] = useState<Voucher>(() => ensureVoucherServices(initial));
  const [vouchers, setVouchers] = useVouchers();
  const [suppliers, setSuppliers] = useSuppliers();
  const [clients, setClients] = useClients();
  const [lang, setLang] = useState<Lang>("en");
  const previewRef = useRef<HTMLDivElement>(null);
  const nav = useNavigate();

  const patch = (p: Partial<Voucher>) => setVoucher((v) => ({ ...v, ...p }));
  const serviceItems = voucher.items ?? [];

  const setServiceItems = (items: ServiceItem[]) => {
    setVoucher((current) => {
      const safeItems = items.length ? items : [emptyServiceItem("hotel")];
      return {
        ...current,
        items: safeItems,
        ...primaryServicePatch(safeItems[0], current),
      };
    });
  };
  const addService = () => setServiceItems([...serviceItems, emptyServiceItem("hotel")]);
  const updateService = (index: number, item: ServiceItem) =>
    setServiceItems(serviceItems.map((current, i) => (i === index ? item : current)));
  const removeService = (index: number) =>
    setServiceItems(serviceItems.filter((_, i) => i !== index));
  const duplicateService = (index: number) => {
    const item = serviceItems[index];
    if (!item) return;
    const copy = { ...item, id: uid(), meta: { ...(item.meta || {}) } };
    setServiceItems([...serviceItems.slice(0, index + 1), copy, ...serviceItems.slice(index + 1)]);
  };

  // Children ages: keep the array length in sync with the children count.
  const setChildrenCount = (n: number) => {
    const count = Math.max(0, Math.floor(n) || 0);
    const ages = (voucher.childrenAges ?? []).slice(0, count);
    patch({ children: count, childrenAges: ages });
  };
  const setChildAge = (index: number, age: number) => {
    const ages = [...(voucher.childrenAges ?? [])];
    ages[index] = Math.max(0, Math.floor(age) || 0);
    patch({ childrenAges: ages });
  };

  const save = () => {
    const nextVoucher = ensureVoucherServices(voucher);
    setVoucher(nextVoucher);
    setVouchers((prev) => {
      const ix = prev.findIndex((p) => p.id === nextVoucher.id);
      if (ix === -1) return [nextVoucher, ...prev];
      const next = [...prev];
      next[ix] = nextVoucher;
      return next;
    });
    toast.success("Voucher saved");
  };
  const remove = () => {
    if (!confirm("Delete this voucher?")) return;
    setVouchers((prev) => prev.filter((p) => p.id !== voucher.id));
    nav("/documents");
  };
  const duplicate = () => {
    const source = ensureVoucherServices(voucher);
    const dup = {
      ...source,
      id: uid(),
      items: source.items?.map((item) => ({ ...item, id: uid(), meta: { ...(item.meta || {}) } })),
      number: source.number + "-COPY",
      createdAt: new Date().toISOString(),
    };
    setVouchers((prev) => [dup, ...prev]);
    nav(`/vouchers/${dup.id}`);
  };
  const download = async () => {
    save();
    if (!previewRef.current) return;
    const name = `ELBAKRI-VOUCHER-${sanitizeFilenamePart(voucher.number)}-${sanitizeFilenamePart(voucher.leaderGuest || voucher.guestNames)}`;
    await exportElementToPdf(previewRef.current, name, "portrait");
  };
  const doPrint = () => {
    if (previewRef.current) printElement(previewRef.current);
  };

  const pickSupplier = (s: Supplier | null) => {
    if (!s) return;
    // Pull the phone into the editor (for the supplier DB) but it is never
    // printed on the voucher PDF — see VoucherPreview.
    patch({ providerName: s.name, address: s.address, telFax: s.phone });
  };
  const saveSupplierToDb = () => {
    if (!voucher.providerName.trim()) return toast.error("Provider name required");
    setSuppliers((prev) => {
      const exists = prev.find((s) => s.name.toLowerCase() === voucher.providerName.toLowerCase());
      const data: Supplier = {
        id: exists?.id || uid(),
        name: voucher.providerName,
        address: voucher.address,
        phone: voucher.telFax,
        email: "",
        notes: "",
      };
      if (exists) return prev.map((s) => (s.id === exists.id ? data : s));
      return [data, ...prev];
    });
    toast.success("Supplier saved");
  };

  const pickGuestAccount = (client: Client | null) => {
    if (!client) {
      patch({ clientId: undefined });
      return;
    }
    const guestName =
      client.type === "company" && client.contactPerson?.trim()
        ? client.contactPerson.trim()
        : client.name;
    patch({
      clientId: client.id,
      leaderGuest: guestName,
      guestNames: voucher.guestNames.trim() ? voucher.guestNames : guestName,
    });
  };

  const saveGuestAccount = () => {
    const firstGuest = voucher.guestNames
      .split(/\r?\n/)
      .map((name) => name.trim())
      .find(Boolean);
    const name = voucher.leaderGuest.trim() || firstGuest;
    if (!name) {
      toast.error("Leader guest or guest name required");
      return;
    }

    const existing = clients.find((client) => client.name.toLowerCase() === name.toLowerCase());
    const clientId = existing?.id || uid();
    const client: Client = existing
      ? { ...existing, name, type: existing.type || "individual" }
      : {
          id: clientId,
          type: "individual",
          name,
          contactPerson: "",
          address: "",
          taxId: "",
          accountNumber: "",
          email: "",
          phone: "",
          notes: "",
        };

    setClients((prev) =>
      existing
        ? prev.map((current) => (current.id === existing.id ? client : current))
        : [client, ...prev],
    );
    patch({
      clientId,
      leaderGuest: name,
      guestNames: voucher.guestNames.trim() ? voucher.guestNames : name,
    });
    toast.success(existing ? "Guest account updated" : "Guest account saved");
  };

  return (
    <div className="flex flex-col xl:flex-row min-h-[calc(100vh-3.5rem)]">
      <section className="editor-pane xl:w-[640px] xl:border-r p-4 space-y-3 overflow-y-auto">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold">
            {vouchers.some((v) => v.id === voucher.id) ? "Edit" : "New"} Voucher
          </h1>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={duplicate}>
              <Copy />
              Duplicate
            </Button>
            <Button size="sm" variant="outline" onClick={remove} className="text-destructive">
              <Trash2 />
            </Button>
            <Button size="sm" onClick={save} className="bg-navy text-navy-foreground">
              <Save />
              Save
            </Button>
          </div>
        </div>

        <Tabs defaultValue="details">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="provider">Provider</TabsTrigger>
            <TabsTrigger value="guests">Guests</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardContent className="pt-5 grid grid-cols-2 gap-3">
                <Field label="Voucher number">
                  <Input
                    value={voucher.number}
                    onChange={(e) => patch({ number: e.target.value })}
                  />
                </Field>
                <Field label="Date">
                  <Input
                    type="date"
                    value={voucher.date}
                    onChange={(e) => patch({ date: e.target.value })}
                  />
                </Field>
                <Field label="Service type">
                  <Select
                    value={voucher.serviceType}
                    onValueChange={(value) => {
                      const nextType = value as ServiceType;
                      const [first, ...rest] = serviceItems.length
                        ? serviceItems
                        : [legacyVoucherService(voucher)];
                      setServiceItems([{ ...first, type: nextType, meta: {} }, ...rest]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Service booking ref">
                  <Input
                    value={voucher.serviceBookingRef}
                    onChange={(e) => patch({ serviceBookingRef: e.target.value })}
                  />
                </Field>
                <Field label="Multiple booking ref">
                  <Input
                    value={voucher.multipleBookingRef}
                    onChange={(e) => patch({ multipleBookingRef: e.target.value })}
                  />
                </Field>
                <Field label="Confirmation number">
                  <Input
                    value={voucher.confirmationNumber}
                    onChange={(e) => patch({ confirmationNumber: e.target.value })}
                  />
                </Field>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-3">
            <div className="space-y-3">
              {serviceItems.map((item, index) => (
                <VoucherServiceItemForm
                  key={item.id}
                  item={item}
                  index={index}
                  canRemove={serviceItems.length > 1}
                  onChange={(next) => updateService(index, next)}
                  onRemove={() => removeService(index)}
                  onDuplicate={() => duplicateService(index)}
                />
              ))}
              <Button type="button" variant="outline" onClick={addService} className="w-full">
                <Plus className="size-4" />
                Add another service
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="provider">
            <Card>
              <CardContent className="pt-5 space-y-3">
                <Field label="Select Supplier / Service Provider">
                  <PickerCombo
                    items={suppliers}
                    onPick={pickSupplier}
                    placeholder="Select supplier…"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Provider / hotel name" className="col-span-2">
                    <Input
                      value={voucher.providerName}
                      onChange={(e) => patch({ providerName: e.target.value })}
                    />
                  </Field>
                  <Field label="Hotel rating">
                    <Select
                      value={String(voucher.hotelRating || 0)}
                      onValueChange={(v) => patch({ hotelRating: Number(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Stars" />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n ? `${n} Stars` : "N/A"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Tel / Fax (supplier DB only — not printed)">
                    <Input
                      value={voucher.telFax}
                      onChange={(e) => patch({ telFax: e.target.value })}
                    />
                  </Field>
                  <Field label="Address" className="col-span-2">
                    <Textarea
                      rows={2}
                      value={voucher.address}
                      onChange={(e) => patch({ address: e.target.value })}
                    />
                  </Field>
                </div>
                <Button size="sm" variant="outline" onClick={saveSupplierToDb}>
                  Save to supplier database
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guests">
            <Card>
              <CardContent className="pt-5 grid grid-cols-2 gap-3">
                <Field label="Saved guest / client account" className="col-span-2">
                  <PickerCombo
                    items={clients}
                    value={voucher.clientId}
                    onPick={pickGuestAccount}
                    placeholder="Select saved guest…"
                  />
                </Field>
                <Field label="Guest names" className="col-span-2">
                  <Textarea
                    rows={3}
                    value={voucher.guestNames}
                    onChange={(e) => patch({ guestNames: e.target.value })}
                    placeholder="One per line"
                  />
                </Field>
                <Field label="Leader guest" className="col-span-2">
                  <Input
                    value={voucher.leaderGuest}
                    onChange={(e) => patch({ leaderGuest: e.target.value })}
                  />
                </Field>
                <div className="col-span-2">
                  <Button type="button" size="sm" variant="outline" onClick={saveGuestAccount}>
                    <UserPlus className="size-4" />
                    Save guest as client account
                  </Button>
                </div>
                <Field label="Room type">
                  <Input
                    value={voucher.roomType}
                    onChange={(e) => patch({ roomType: e.target.value })}
                  />
                </Field>
                <Field label="Rooms">
                  <Input
                    type="number"
                    min={1}
                    value={voucher.numberOfRooms}
                    onChange={(e) => patch({ numberOfRooms: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Adults">
                  <Input
                    type="number"
                    min={1}
                    value={voucher.adults}
                    onChange={(e) => patch({ adults: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Children">
                  <Input
                    type="number"
                    min={0}
                    value={voucher.children}
                    onChange={(e) => setChildrenCount(Number(e.target.value))}
                  />
                </Field>
                {voucher.children > 0 && (
                  <div className="col-span-2 grid grid-cols-3 gap-2 rounded border border-dashed p-2">
                    {Array.from({ length: voucher.children }).map((_, i) => (
                      <Field key={i} label={`Child ${i + 1} age`}>
                        <Input
                          type="number"
                          min={0}
                          max={17}
                          value={voucher.childrenAges?.[i] ?? ""}
                          onChange={(e) => setChildAge(i, Number(e.target.value))}
                          placeholder="yrs"
                        />
                      </Field>
                    ))}
                  </div>
                )}
                <Field label="Check-in">
                  <Input
                    type="date"
                    value={voucher.checkIn}
                    onChange={(e) => patch({ checkIn: e.target.value })}
                  />
                </Field>
                <Field label="Check-out">
                  <Input
                    type="date"
                    value={voucher.checkOut}
                    onChange={(e) => patch({ checkOut: e.target.value })}
                  />
                </Field>
                <Field label="Rate basis / meal plan" className="col-span-2">
                  <Select value={voucher.rateBasis} onValueChange={(v) => patch({ rateBasis: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Board" />
                    </SelectTrigger>
                    <SelectContent>
                      {RATE_BASIS.map((b) => (
                        <SelectItem key={b.value} value={b.value}>
                          {b.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Special remarks" className="col-span-2">
                  <Textarea
                    rows={3}
                    value={voucher.remarks}
                    onChange={(e) => patch({ remarks: e.target.value })}
                  />
                </Field>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies">
            <Card>
              <CardContent className="pt-5 grid grid-cols-1 gap-3">
                <Field label="Check-in / out times">
                  <Input
                    value={voucher.checkInOutTimes}
                    onChange={(e) => patch({ checkInOutTimes: e.target.value })}
                    placeholder="e.g. Check-in 14:00, Check-out 12:00"
                  />
                </Field>
                <Field label="Check-in restrictions">
                  <Textarea
                    rows={2}
                    value={voucher.checkInRestrictions}
                    onChange={(e) => patch({ checkInRestrictions: e.target.value })}
                  />
                </Field>
                <Field label="Age requirements">
                  <Input
                    value={voucher.ageRequirements}
                    onChange={(e) => patch({ ageRequirements: e.target.value })}
                  />
                </Field>
                <Field label="Pets policy">
                  <Input
                    value={voucher.petsPolicy}
                    onChange={(e) => patch({ petsPolicy: e.target.value })}
                  />
                </Field>
                <Field label="Front desk notes">
                  <Textarea
                    rows={2}
                    value={voucher.frontDeskNotes}
                    onChange={(e) => patch({ frontDeskNotes: e.target.value })}
                  />
                </Field>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showId"
                      checked={voucher.showIdentification !== false}
                      onCheckedChange={(c) => patch({ showIdentification: c === true })}
                    />
                    <Label
                      htmlFor="showId"
                      className="text-[11px] uppercase tracking-wide text-muted-foreground"
                    >
                      Show identification requirements (on by default)
                    </Label>
                  </div>
                  <Textarea
                    rows={2}
                    value={voucher.identificationRequirements}
                    onChange={(e) => patch({ identificationRequirements: e.target.value })}
                    placeholder="Leave empty to print the standard passport / national ID text."
                  />
                </div>
                <Field label="Children & extra bed policy">
                  <Textarea
                    rows={2}
                    value={voucher.childrenExtraBedPolicy}
                    onChange={(e) => patch({ childrenExtraBedPolicy: e.target.value })}
                  />
                </Field>
                <Field label="Dining notes">
                  <Textarea
                    rows={2}
                    value={voucher.diningNotes}
                    onChange={(e) => patch({ diningNotes: e.target.value })}
                  />
                </Field>
                <Field label="Final terms paragraph">
                  <Textarea
                    rows={3}
                    value={voucher.finalTerms}
                    onChange={(e) => patch({ finalTerms: e.target.value })}
                    placeholder="Default text will print if empty."
                  />
                </Field>
                <div className="flex items-center gap-2 rounded border p-3">
                  <Checkbox
                    id="showVoucherTerms"
                    checked={voucher.showTerms === true}
                    onCheckedChange={(c) => patch({ showTerms: c === true })}
                  />
                  <Label htmlFor="showVoucherTerms" className="text-sm">
                    Add terms page
                  </Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <section className="doc-preview-pane flex-1 bg-muted/30 overflow-y-auto">
        <div className="doc-preview-toolbar sticky top-0 z-10 bg-background/90 backdrop-blur border-b px-4 py-2 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium">Live preview</div>
            <LanguageToggle lang={lang} onChange={setLang} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={doPrint}>
              <Printer />
              Print
            </Button>
            <Button size="sm" onClick={download} className="bg-navy text-navy-foreground">
              <Download />
              Download PDF
            </Button>
          </div>
        </div>
        <div className="doc-preview-scroll">
          <div className="doc-preview-inner p-6 flex justify-center">
            <div ref={previewRef}>
              <VoucherPreview voucher={voucher} lang={lang} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function buildBlankVoucher(opts: { number: string }): Voucher {
  return {
    id: uid(),
    kind: "voucher",
    number: opts.number,
    date: new Date().toISOString().slice(0, 10),
    serviceType: "hotel",
    items: [emptyServiceItem("hotel")],
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
    childrenAges: [],
    checkIn: "",
    checkOut: "",
    rateBasis: "Bed & Breakfast",
    remarks: "",
    checkInRestrictions: "",
    ageRequirements: "",
    petsPolicy: "",
    frontDeskNotes: "",
    identificationRequirements: "",
    showIdentification: true,
    childrenExtraBedPolicy: "",
    diningNotes: "",
    checkInOutTimes: "Check-in from 14:00 · Check-out by 12:00",
    finalTerms: "",
    showTerms: false,
    createdAt: new Date().toISOString(),
  };
}
