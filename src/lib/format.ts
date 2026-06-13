import type { Currency, ServiceItem } from "./storage";

const CUR_SYMBOL: Record<Currency, string> = {
  USD: "$", EUR: "€", EGP: "EGP ", SAR: "SAR ", AED: "AED ",
};

export function formatMoney(value: number, currency: Currency) {
  const v = Number.isFinite(value) ? value : 0;
  const sym = CUR_SYMBOL[currency] ?? "";
  return `${sym}${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(iso: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return iso; }
}

export function nightsBetween(a: string, b: string): number {
  if (!a || !b) return 0;
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  if (!Number.isFinite(d1) || !Number.isFinite(d2)) return 0;
  return Math.max(0, Math.round((d2 - d1) / 86400000));
}

export function computeItemTotal(item: ServiceItem): number {
  const m = item.meta || {};
  switch (item.type) {
    case "hotel": {
      const nights = nightsBetween(m.checkIn, m.checkOut) || 0;
      const rooms = Number(m.rooms) || 1;
      const adults = Number(m.adults) || 1;
      const price = Number(item.unitPrice) || 0;
      if (m.calcMethod === "total") return price;
      if (m.calcMethod === "per_person_per_night") return price * adults * Math.max(nights, 1);
      return price * rooms * Math.max(nights, 1); // per room per night
    }
    case "tour": {
      const adults = Number(m.adults) || 0;
      const children = Number(m.children) || 0;
      return (Number(m.priceAdult)||0)*adults + (Number(m.priceChild)||0)*children;
    }
    case "activity": {
      const persons = Number(m.persons) || 0;
      return (Number(item.unitPrice)||0) * persons;
    }
    case "transfer": {
      const vehicles = Number(m.vehicles) || 1;
      return (Number(item.unitPrice)||0) * vehicles;
    }
    case "package": {
      const adults = Number(m.adults) || 0;
      const children = Number(m.children) || 0;
      return (Number(m.priceAdult)||0)*adults + (Number(m.priceChild)||0)*children;
    }
    default:
      return (Number(item.quantity)||0) * (Number(item.unitPrice)||0);
  }
}

export interface InvoiceTotals {
  subtotal: number;
  vat: number;
  discount: number;
  grandTotal: number;
  balance: number;
}
export function computeInvoiceTotals(opts: {
  items: ServiceItem[];
  vatPercent: number;
  discountType: "amount" | "percent";
  discountValue: number;
  paidAmount: number;
  totalOverride: number | null;
}): InvoiceTotals {
  const subtotal = opts.items.reduce((s, it) => s + (Number(it.total) || 0), 0);
  const discount = opts.discountType === "percent"
    ? subtotal * (Number(opts.discountValue)||0) / 100
    : (Number(opts.discountValue)||0);
  const taxable = Math.max(0, subtotal - discount);
  const vat = taxable * (Number(opts.vatPercent)||0) / 100;
  const grandTotal = opts.totalOverride != null ? opts.totalOverride : taxable + vat;
  const balance = grandTotal - (Number(opts.paidAmount)||0);
  return { subtotal, vat, discount, grandTotal, balance };
}
