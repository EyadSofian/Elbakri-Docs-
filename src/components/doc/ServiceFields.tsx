import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ServiceItem } from "@/lib/storage";
import { nightsBetween } from "@/lib/format";

type Props = {
  item: ServiceItem;
  onChange: (patch: Partial<ServiceItem>) => void;
  onMeta: (patch: Record<string, any>) => void;
};

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function HotelFields({ item, onMeta }: Props) {
  const m = item.meta;
  const nights = nightsBetween(m.checkIn, m.checkOut);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Field label="Hotel name" className="col-span-2"><Input value={m.hotelName || ""} onChange={(e) => onMeta({ hotelName: e.target.value })} /></Field>
      <Field label="Rating">
        <Select value={String(m.rating || "")} onValueChange={(v) => onMeta({ rating: Number(v) })}>
          <SelectTrigger><SelectValue placeholder="Stars" /></SelectTrigger>
          <SelectContent>{[3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} Stars</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="Room type"><Input value={m.roomType || ""} onChange={(e) => onMeta({ roomType: e.target.value })} /></Field>
      <Field label="Address" className="col-span-4"><Input value={m.address || ""} onChange={(e) => onMeta({ address: e.target.value })} /></Field>
      <Field label="Rooms"><Input type="number" min={1} value={m.rooms ?? 1} onChange={(e) => onMeta({ rooms: Number(e.target.value) })} /></Field>
      <Field label="Adults"><Input type="number" min={1} value={m.adults ?? 2} onChange={(e) => onMeta({ adults: Number(e.target.value) })} /></Field>
      <Field label="Children"><Input type="number" min={0} value={m.children ?? 0} onChange={(e) => onMeta({ children: Number(e.target.value) })} /></Field>
      <Field label="Nights"><Input value={nights} readOnly className="bg-muted" /></Field>
      <Field label="Check-in"><Input type="date" value={m.checkIn || ""} onChange={(e) => onMeta({ checkIn: e.target.value })} /></Field>
      <Field label="Check-out"><Input type="date" value={m.checkOut || ""} onChange={(e) => onMeta({ checkOut: e.target.value })} /></Field>
      <Field label="Board basis" className="col-span-2">
        <Select value={m.board || ""} onValueChange={(v) => onMeta({ board: v })}>
          <SelectTrigger><SelectValue placeholder="Select basis" /></SelectTrigger>
          <SelectContent>
            {["Room Only","Bed & Breakfast","Half Board","Full Board","All Inclusive"].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Price method" className="col-span-2">
        <Select value={m.calcMethod || "per_room_per_night"} onValueChange={(v) => onMeta({ calcMethod: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="per_room_per_night">Per room / night</SelectItem>
            <SelectItem value="total">Total stay price</SelectItem>
            <SelectItem value="per_person_per_night">Per person / night</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}

export function TourFields({ item, onMeta }: Props) {
  const m = item.meta;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Field label="Tour name" className="col-span-2"><Input value={m.tourName || ""} onChange={(e) => onMeta({ tourName: e.target.value })} /></Field>
      <Field label="City / destination" className="col-span-2"><Input value={m.city || ""} onChange={(e) => onMeta({ city: e.target.value })} /></Field>
      <Field label="Tour date"><Input type="date" value={m.tourDate || ""} onChange={(e) => onMeta({ tourDate: e.target.value })} /></Field>
      <Field label="Pickup time"><Input type="time" value={m.pickupTime || ""} onChange={(e) => onMeta({ pickupTime: e.target.value })} /></Field>
      <Field label="Pickup location" className="col-span-2"><Input value={m.pickup || ""} onChange={(e) => onMeta({ pickup: e.target.value })} /></Field>
      <Field label="Adults"><Input type="number" min={0} value={m.adults ?? 1} onChange={(e) => onMeta({ adults: Number(e.target.value) })} /></Field>
      <Field label="Children"><Input type="number" min={0} value={m.children ?? 0} onChange={(e) => onMeta({ children: Number(e.target.value) })} /></Field>
      <Field label="Infant"><Input type="number" min={0} value={m.infant ?? 0} onChange={(e) => onMeta({ infant: Number(e.target.value) })} /></Field>
      <Field label="Guide language"><Input value={m.language || ""} onChange={(e) => onMeta({ language: e.target.value })} /></Field>
      <Field label="Price / adult"><Input type="number" min={0} value={m.priceAdult ?? 0} onChange={(e) => onMeta({ priceAdult: Number(e.target.value) })} /></Field>
      <Field label="Price / child"><Input type="number" min={0} value={m.priceChild ?? 0} onChange={(e) => onMeta({ priceChild: Number(e.target.value) })} /></Field>
    </div>
  );
}

export function ActivityFields({ item, onMeta }: Props) {
  const m = item.meta;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Field label="Activity name" className="col-span-2"><Input value={m.activityName || ""} onChange={(e) => onMeta({ activityName: e.target.value })} /></Field>
      <Field label="Date"><Input type="date" value={m.date || ""} onChange={(e) => onMeta({ date: e.target.value })} /></Field>
      <Field label="Time"><Input type="time" value={m.time || ""} onChange={(e) => onMeta({ time: e.target.value })} /></Field>
      <Field label="Location" className="col-span-2"><Input value={m.location || ""} onChange={(e) => onMeta({ location: e.target.value })} /></Field>
      <Field label="Persons"><Input type="number" min={0} value={m.persons ?? 1} onChange={(e) => onMeta({ persons: Number(e.target.value) })} /></Field>
      <Field label="Price / person"><Input type="number" min={0} value={item.unitPrice ?? 0} onChange={() => {}} readOnly className="bg-muted" /></Field>
    </div>
  );
}

export function TransferFields({ item, onMeta }: Props) {
  const m = item.meta;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Field label="Transfer type" className="col-span-2">
        <Select value={m.transferType || ""} onValueChange={(v) => onMeta({ transferType: v })}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            {["Airport Transfer","Hotel Transfer","Private Car","Bus","Other"].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Date"><Input type="date" value={m.date || ""} onChange={(e) => onMeta({ date: e.target.value })} /></Field>
      <Field label="Time"><Input type="time" value={m.time || ""} onChange={(e) => onMeta({ time: e.target.value })} /></Field>
      <Field label="From" className="col-span-2"><Input value={m.from || ""} onChange={(e) => onMeta({ from: e.target.value })} /></Field>
      <Field label="To" className="col-span-2"><Input value={m.to || ""} onChange={(e) => onMeta({ to: e.target.value })} /></Field>
      <Field label="Vehicle type"><Input value={m.vehicle || ""} onChange={(e) => onMeta({ vehicle: e.target.value })} /></Field>
      <Field label="Vehicles"><Input type="number" min={1} value={m.vehicles ?? 1} onChange={(e) => onMeta({ vehicles: Number(e.target.value) })} /></Field>
      <Field label="Passengers"><Input type="number" min={1} value={m.pax ?? 1} onChange={(e) => onMeta({ pax: Number(e.target.value) })} /></Field>
      <Field label="Driver / contact" className="col-span-4"><Input value={m.driver || ""} onChange={(e) => onMeta({ driver: e.target.value })} /></Field>
    </div>
  );
}

export function SimFields({ item, onMeta }: Props) {
  const m = item.meta;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Field label="SIM type / package" className="col-span-4"><Input value={m.simType || ""} onChange={(e) => onMeta({ simType: e.target.value })} /></Field>
      <Field label="Activation notes" className="col-span-4"><Textarea rows={2} value={m.activation || ""} onChange={(e) => onMeta({ activation: e.target.value })} /></Field>
    </div>
  );
}

export function VisaFields({ item, onMeta }: Props) {
  const m = item.meta;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Field label="Country" className="col-span-2"><Input value={m.country || ""} onChange={(e) => onMeta({ country: e.target.value })} /></Field>
      <Field label="Visa type" className="col-span-2"><Input value={m.visaType || ""} onChange={(e) => onMeta({ visaType: e.target.value })} /></Field>
      <Field label="Passenger names" className="col-span-4"><Textarea rows={2} value={m.passengers || ""} onChange={(e) => onMeta({ passengers: e.target.value })} /></Field>
      <Field label="Application ref"><Input value={m.appRef || ""} onChange={(e) => onMeta({ appRef: e.target.value })} /></Field>
      <Field label="Status">
        <Select value={m.status || ""} onValueChange={(v) => onMeta({ status: v })}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>{["Pending","Submitted","Approved","Rejected","Issued"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
    </div>
  );
}

export function FlightFields({ item, onMeta }: Props) {
  const m = item.meta;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Field label="Airline" className="col-span-2"><Input value={m.airline || ""} onChange={(e) => onMeta({ airline: e.target.value })} /></Field>
      <Field label="PNR"><Input value={m.pnr || ""} onChange={(e) => onMeta({ pnr: e.target.value })} /></Field>
      <Field label="Ticket number"><Input value={m.ticket || ""} onChange={(e) => onMeta({ ticket: e.target.value })} /></Field>
      <Field label="Route" className="col-span-2"><Input value={m.route || ""} onChange={(e) => onMeta({ route: e.target.value })} placeholder="CAI → DXB → CAI" /></Field>
      <Field label="Departure"><Input type="date" value={m.departure || ""} onChange={(e) => onMeta({ departure: e.target.value })} /></Field>
      <Field label="Return"><Input type="date" value={m.returnDate || ""} onChange={(e) => onMeta({ returnDate: e.target.value })} /></Field>
    </div>
  );
}

export function PackageFields({ item, onMeta }: Props) {
  const m = item.meta;
  const nights = nightsBetween(m.departure, m.returnDate);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Field label="Destination" className="col-span-2"><Input value={m.destination || ""} onChange={(e) => onMeta({ destination: e.target.value })} /></Field>
      <Field label="Package name" className="col-span-2"><Input value={m.packageName || ""} onChange={(e) => onMeta({ packageName: e.target.value })} /></Field>
      <Field label="Departure"><Input type="date" value={m.departure || ""} onChange={(e) => onMeta({ departure: e.target.value })} /></Field>
      <Field label="Return"><Input type="date" value={m.returnDate || ""} onChange={(e) => onMeta({ returnDate: e.target.value })} /></Field>
      <Field label="Nights"><Input value={nights} readOnly className="bg-muted" /></Field>
      <Field label="Meal plan"><Input value={m.meal || ""} onChange={(e) => onMeta({ meal: e.target.value })} /></Field>
      <Field label="Hotel" className="col-span-2"><Input value={m.hotel || ""} onChange={(e) => onMeta({ hotel: e.target.value })} /></Field>
      <Field label="Room type" className="col-span-2"><Input value={m.roomType || ""} onChange={(e) => onMeta({ roomType: e.target.value })} /></Field>
      <Field label="Adults"><Input type="number" min={0} value={m.adults ?? 2} onChange={(e) => onMeta({ adults: Number(e.target.value) })} /></Field>
      <Field label="Children"><Input type="number" min={0} value={m.children ?? 0} onChange={(e) => onMeta({ children: Number(e.target.value) })} /></Field>
      <Field label="Infant"><Input type="number" min={0} value={m.infant ?? 0} onChange={(e) => onMeta({ infant: Number(e.target.value) })} /></Field>
      <Field label="Price / adult"><Input type="number" min={0} value={m.priceAdult ?? 0} onChange={(e) => onMeta({ priceAdult: Number(e.target.value) })} /></Field>
      <Field label="Price / child"><Input type="number" min={0} value={m.priceChild ?? 0} onChange={(e) => onMeta({ priceChild: Number(e.target.value) })} /></Field>
      <Field label="Included services" className="col-span-2"><Textarea rows={2} value={m.included || ""} onChange={(e) => onMeta({ included: e.target.value })} /></Field>
      <Field label="Excluded services" className="col-span-2"><Textarea rows={2} value={m.excluded || ""} onChange={(e) => onMeta({ excluded: e.target.value })} /></Field>
    </div>
  );
}

export function ServiceDynamicFields(props: Props) {
  switch (props.item.type) {
    case "hotel": return <HotelFields {...props} />;
    case "tour": return <TourFields {...props} />;
    case "activity": return <ActivityFields {...props} />;
    case "transfer": return <TransferFields {...props} />;
    case "sim": return <SimFields {...props} />;
    case "visa": return <VisaFields {...props} />;
    case "flight": return <FlightFields {...props} />;
    case "package": return <PackageFields {...props} />;
    default: return null;
  }
}
