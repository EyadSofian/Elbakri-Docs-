// API-backed persistence for Elbakri Overseas internal app, with localStorage
// fallback for offline development and first-run migration.
import { useEffect, useState, useCallback } from "react";

export type Currency = "EGP" | "USD" | "EUR" | "SAR" | "AED";
export type DocStatus = "Draft" | "Unpaid" | "Paid" | "Partial" | "Overdue" | "Cancelled";
export type ServiceType =
  | "hotel"
  | "tour"
  | "activity"
  | "transfer"
  | "sim"
  | "visa"
  | "flight"
  | "package"
  | "other";

export type PaymentMethod =
  | "bank_transfer"
  | "cash"
  | "card"
  | "vodafone_cash"
  | "instapay"
  | "other";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; labelAr: string }[] = [
  { value: "bank_transfer", label: "Bank Transfer", labelAr: "تحويل بنكي" },
  { value: "cash", label: "Cash", labelAr: "نقدي" },
  { value: "card", label: "Card", labelAr: "بطاقة" },
  { value: "vodafone_cash", label: "Vodafone Cash", labelAr: "فودافون كاش" },
  { value: "instapay", label: "Instapay", labelAr: "انستاباي" },
  { value: "other", label: "Other", labelAr: "أخرى" },
];

export const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: "hotel", label: "Hotel / Accommodation" },
  { value: "tour", label: "Tour / Excursion" },
  { value: "activity", label: "Activity / Entertainment" },
  { value: "transfer", label: "Transfer / Transport" },
  { value: "sim", label: "SIM Card" },
  { value: "visa", label: "Visa Service" },
  { value: "flight", label: "Flight Ticket" },
  { value: "package", label: "Package / Trip" },
  { value: "other", label: "Other Service" },
];

export type ClientType = "individual" | "company";
export const CLIENT_TYPES: { value: ClientType; label: string; labelAr: string }[] = [
  { value: "company", label: "Company / B2B", labelAr: "شركة / B2B" },
  { value: "individual", label: "Individual", labelAr: "عميل فردي" },
];

export type SupplierType =
  | "hotel"
  | "transport"
  | "tour_operator"
  | "activity"
  | "visa_office"
  | "flight"
  | "other";
export const SUPPLIER_TYPES: { value: SupplierType; label: string }[] = [
  { value: "hotel", label: "Hotel" },
  { value: "transport", label: "Transport Company" },
  { value: "tour_operator", label: "Tour Operator" },
  { value: "activity", label: "Activity Provider" },
  { value: "visa_office", label: "Visa Office" },
  { value: "flight", label: "Flight Supplier" },
  { value: "other", label: "Other" },
];

export interface ServiceItem {
  id: string;
  type: ServiceType;
  description: string;
  passengerName: string;
  bookingRef: string;
  supplierRef: string;
  startDate: string;
  endDate: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  notes: string;
  meta: Record<string, any>;
}

export interface Client {
  id: string;
  type?: ClientType;
  name: string;
  contactPerson?: string;
  address: string;
  taxId: string;
  accountNumber?: string;
  currency?: Currency;
  email: string;
  phone: string;
  notes: string;
  openingBalance?: number;
  openingBalanceDate?: string;
  openingBalanceCurrency?: Currency;
}

export interface Supplier {
  id: string;
  type?: SupplierType;
  name: string;
  address: string;
  phone: string;
  email: string;
  notes: string;
}

export interface ServiceTemplate {
  id: string;
  name: string;
  type: ServiceType;
  description: string;
  unit: string;
  unitPrice: number;
  meta: Record<string, any>;
  notes: string;
}

export interface Invoice {
  id: string;
  kind: "invoice";
  number: string;
  bookingRef: string;
  date: string;
  dueDate: string;
  status: DocStatus;
  currency: Currency;
  clientId?: string; // link to client database
  client: Client;
  items: ServiceItem[];
  notes: string;
  payment: {
    bankName: string;
    accountNumber: string;
    iban: string;
    swift: string;
    notes: string;
  };
  vatPercent: number;
  discountType: "amount" | "percent";
  discountValue: number;
  paidAmount: number;
  totalOverride: number | null;
  createdAt: string;
}

// Payment received from a client (B2B account ledger).
export interface PaymentAllocation {
  invoiceId: string;
  amount: number;
}
export interface Payment {
  id: string;
  number: string; // e.g. PAY-2026-0001
  clientId: string; // owner of the payment
  date: string; // ISO date
  currency: Currency;
  amount: number; // total received
  method: PaymentMethod;
  reference: string; // external ref
  notes: string;
  allocations: PaymentAllocation[]; // sum may be < amount (rest = client credit)
  createdAt: string;
}

export const CREDIT_NOTE_REASONS = [
  "discount",
  "cancelled_service",
  "price_correction",
  "refund_adjustment",
  "supplier_issue",
  "manual_adjustment",
  "other",
] as const;
export type CreditNoteReason = (typeof CREDIT_NOTE_REASONS)[number];

export const DEBIT_NOTE_REASONS = [
  "extra_charge",
  "price_correction",
  "penalty",
  "service_addition",
  "manual_adjustment",
  "other",
] as const;
export type DebitNoteReason = (typeof DEBIT_NOTE_REASONS)[number];

export interface CreditNote {
  id: string;
  number: string;
  clientId: string;
  date: string;
  currency: Currency;
  amount: number;
  reason: CreditNoteReason | string;
  notes?: string;
  invoiceId?: string; // optional related invoice
  createdAt: string;
}

export interface DebitNote {
  id: string;
  number: string; // e.g. DN-2026-0001
  clientId: string;
  date: string;
  currency: Currency;
  amount: number;
  reason: DebitNoteReason | string;
  notes?: string;
  invoiceId?: string;
  createdAt: string;
}

export interface Refund {
  id: string;
  number: string; // RF-2026-0001
  clientId: string;
  date: string;
  currency: Currency;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface ManualAdjustment {
  id: string;
  number: string; // ADJ-2026-0001
  clientId: string;
  date: string;
  currency: Currency;
  amount: number;
  direction: "debit" | "credit";
  reason: string;
  notes?: string;
  createdAt: string;
}

export interface StatementTxn {
  id: string;
  date: string;
  voucher: string;
  invoice: string;
  description: string;
  debit: number;
  credit: number;
}

export interface Statement {
  id: string;
  kind: "statement";
  accountName: string;
  accountNumber: string;
  customerName: string;
  currency: Currency;
  periodFrom: string;
  periodTo: string;
  preparedBy: string;
  openingBalance: number;
  transactions: StatementTxn[];
  createdAt: string;
}

export interface Voucher {
  id: string;
  kind: "voucher";
  number: string;
  date: string;
  serviceType: ServiceType;
  providerName: string;
  hotelRating: number;
  address: string;
  telFax: string;
  serviceBookingRef: string;
  multipleBookingRef: string;
  confirmationNumber: string;
  guestNames: string;
  leaderGuest: string;
  numberOfRooms: number;
  roomType: string;
  adults: number;
  children: number;
  childrenAges?: number[];
  checkIn: string;
  checkOut: string;
  rateBasis: string;
  remarks: string;
  checkInRestrictions: string;
  ageRequirements: string;
  petsPolicy: string;
  frontDeskNotes: string;
  identificationRequirements: string;
  showIdentification?: boolean;
  childrenExtraBedPolicy: string;
  diningNotes: string;
  checkInOutTimes: string;
  finalTerms: string;
  createdAt: string;
}

export interface CompanySettings {
  name: string;
  tagline: string;
  established: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  commercialRegister: string;
  defaultCurrency: Currency;
  defaultBank: {
    bankName: string;
    accountNumber: string;
    iban: string;
    swift: string;
    notes: string;
  };
  invoicePrefix: string;
  voucherPrefix: string;
  nextInvoiceNumber: number;
  nextVoucherNumber: number;
  paymentPrefix?: string;
  nextPaymentNumber?: number;
  creditNotePrefix?: string;
  nextCreditNoteNumber?: number;
  debitNotePrefix?: string;
  nextDebitNoteNumber?: number;
  refundPrefix?: string;
  nextRefundNumber?: number;
  adjustmentPrefix?: string;
  nextAdjustmentNumber?: number;
}

const DEFAULT_SETTINGS: CompanySettings = {
  name: "ELBAKRI OVERSEAS",
  tagline: "Travel & Tourism",
  established: "1982",
  address: "Cairo, Egypt",
  phone: "+20 100 000 0000",
  email: "info@elbakrioverseas.com",
  website: "www.elbakrioverseas.com",
  taxId: "",
  commercialRegister: "",
  defaultCurrency: "USD",
  defaultBank: { bankName: "", accountNumber: "", iban: "", swift: "", notes: "" },
  invoicePrefix: "INV-2026",
  voucherPrefix: "VCH-2026",
  nextInvoiceNumber: 1,
  nextVoucherNumber: 1,
  paymentPrefix: "PAY-2026",
  nextPaymentNumber: 1,
  creditNotePrefix: "CN-2026",
  nextCreditNoteNumber: 1,
  debitNotePrefix: "DN-2026",
  nextDebitNoteNumber: 1,
  refundPrefix: "RF-2026",
  nextRefundNumber: 1,
  adjustmentPrefix: "ADJ-2026",
  nextAdjustmentNumber: 1,
};

const KEYS = {
  invoices: "elbakri:invoices",
  vouchers: "elbakri:vouchers",
  statements: "elbakri:statements",
  clients: "elbakri:clients",
  suppliers: "elbakri:suppliers",
  templates: "elbakri:templates",
  settings: "elbakri:settings",
  payments: "elbakri:payments",
  creditNotes: "elbakri:creditNotes",
  debitNotes: "elbakri:debitNotes",
  refunds: "elbakri:refunds",
  adjustments: "elbakri:adjustments",
} as const;

type CollectionName = keyof typeof KEYS;
type StoreValue = unknown[] | CompanySettings;

const API_BASE = ((import.meta.env.VITE_API_BASE as string | undefined) ?? "/api").replace(
  /\/$/,
  "",
);
const API_TOKEN = import.meta.env.VITE_API_TOKEN as string | undefined;

const cache = new Map<CollectionName, StoreValue>();
const listeners = new Map<CollectionName, Set<() => void>>();

function authHeaders(): HeadersInit {
  return API_TOKEN ? { "X-Elbakri-Token": API_TOKEN } : {};
}

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function hasLocalValue(key: string) {
  return typeof window !== "undefined" && window.localStorage.getItem(key) != null;
}

function writeLocal<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  // Do NOT dispatch a synthetic same-tab "storage" event here. Same-tab
  // subscribers are already updated through setCached()'s listener notify, and
  // re-entering setCached from a synthetic event (especially while inside a
  // setValue updater) caused an infinite render loop that froze the browser.
  // Real storage events still fire in OTHER tabs and are handled by onStorage.
}

function mergeSettings(settings: CompanySettings): CompanySettings {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    defaultBank: { ...DEFAULT_SETTINGS.defaultBank, ...settings.defaultBank },
  };
}

function setCached<T extends StoreValue>(name: CollectionName, value: T) {
  const next = name === "settings" ? mergeSettings(value as CompanySettings) : value;
  cache.set(name, next);
  listeners.get(name)?.forEach((notify) => notify());
}

function subscribe(name: CollectionName, notify: () => void) {
  const set = listeners.get(name) ?? new Set<() => void>();
  set.add(notify);
  listeners.set(name, set);
  return () => {
    set.delete(notify);
  };
}

async function fetchCollection<T extends StoreValue>(
  name: CollectionName,
  key: string,
  fallback: T,
): Promise<T> {
  const res = await fetch(`${API_BASE}/collections.php?collection=${encodeURIComponent(name)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load ${name}: ${res.status}`);
  const data = (await res.json()) as { value: T | null; exists: boolean };
  let value = data.value ?? fallback;

  if (!data.exists && hasLocalValue(key)) {
    value = readLocal(key, fallback);
    await saveCollection(name, value);
  }

  if (name === "settings") value = mergeSettings(value as CompanySettings) as T;
  setCached(name, value);
  writeLocal(key, value);
  return value;
}

async function saveCollection<T extends StoreValue>(name: CollectionName, value: T) {
  const res = await fetch(`${API_BASE}/collections.php`, {
    method: "PUT",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify({ collection: name, value }),
  });
  if (!res.ok) throw new Error(`Failed to save ${name}: ${res.status}`);
}

export function uid() {
  return (
    globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function useStore<T extends StoreValue>(name: CollectionName, fallback: T) {
  const key = KEYS[name];
  const [value, setValue] = useState<T>(() => {
    const cached = cache.get(name) as T | undefined;
    if (cached !== undefined) return cached;
    const local = readLocal(key, fallback);
    return name === "settings" ? (mergeSettings(local as CompanySettings) as T) : local;
  });

  useEffect(() => {
    return subscribe(name, () => {
      const cached = cache.get(name) as T | undefined;
      if (cached !== undefined) setValue(cached);
    });
  }, [name]);

  useEffect(() => {
    fetchCollection(name, key, fallback).catch((error) => {
      console.error(error);
    });

    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        const local = readLocal(key, fallback);
        setCached(name, local);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      // Side effects must run OUTSIDE a setValue updater. setCached() notifies
      // every subscriber (calling their setValue), so doing it inside the
      // updater was re-entrant and looped forever. Compute the next value from
      // the shared cache, then let setCached drive each subscriber's setValue.
      const current = (cache.get(name) as T | undefined) ?? readLocal(key, fallback);
      const v = typeof next === "function" ? (next as (p: T) => T)(current) : next;
      setCached(name, v);
      writeLocal(key, v);
      saveCollection(name, v).catch((error) => {
        console.error(error);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, key],
  );

  return [value, update] as const;
}

export const useInvoices = () => useStore<Invoice[]>("invoices", []);
export const useVouchers = () => useStore<Voucher[]>("vouchers", []);
export const useStatements = () => useStore<Statement[]>("statements", []);
export const useClients = () => useStore<Client[]>("clients", []);
export const useSuppliers = () => useStore<Supplier[]>("suppliers", []);
export const useTemplates = () => useStore<ServiceTemplate[]>("templates", []);
export const useSettings = () => useStore<CompanySettings>("settings", DEFAULT_SETTINGS);
export const usePayments = () => useStore<Payment[]>("payments", []);
export const useCreditNotes = () => useStore<CreditNote[]>("creditNotes", []);
export const useDebitNotes = () => useStore<DebitNote[]>("debitNotes", []);
export const useRefunds = () => useStore<Refund[]>("refunds", []);
export const useAdjustments = () => useStore<ManualAdjustment[]>("adjustments", []);

export function getSettings(): CompanySettings {
  return mergeSettings(
    (cache.get("settings") as CompanySettings | undefined) ??
      readLocal(KEYS.settings, DEFAULT_SETTINGS),
  );
}

export async function getSettingsAsync(): Promise<CompanySettings> {
  try {
    return await fetchCollection("settings", KEYS.settings, DEFAULT_SETTINGS);
  } catch (error) {
    console.error(error);
    return getSettings();
  }
}

export function saveSettings(s: CompanySettings) {
  const settings = mergeSettings(s);
  setCached("settings", settings);
  writeLocal(KEYS.settings, settings);
  saveCollection("settings", settings).catch((error) => {
    console.error(error);
  });
}

function nextSequential(
  prefixField: keyof CompanySettings,
  numField: keyof CompanySettings,
  defaultPrefix: string,
): string {
  const s = getSettings();
  const prefix = (s[prefixField] as string) || defaultPrefix;
  const n = (s[numField] as number) || 1;
  const num = `${prefix}-${String(n).padStart(4, "0")}`;
  saveSettings({ ...s, [prefixField]: prefix, [numField]: n + 1 } as CompanySettings);
  return num;
}
export const nextInvoiceNumber = () => {
  const s = getSettings();
  const num = `${s.invoicePrefix}-${String(s.nextInvoiceNumber).padStart(4, "0")}`;
  saveSettings({ ...s, nextInvoiceNumber: s.nextInvoiceNumber + 1 });
  return num;
};
export const nextVoucherNumber = () => {
  const s = getSettings();
  const num = `${s.voucherPrefix}-${String(s.nextVoucherNumber).padStart(4, "0")}`;
  saveSettings({ ...s, nextVoucherNumber: s.nextVoucherNumber + 1 });
  return num;
};
export const nextPaymentNumber = () =>
  nextSequential("paymentPrefix", "nextPaymentNumber", "PAY-2026");
export const nextCreditNoteNumber = () =>
  nextSequential("creditNotePrefix", "nextCreditNoteNumber", "CN-2026");
export const nextDebitNoteNumber = () =>
  nextSequential("debitNotePrefix", "nextDebitNoteNumber", "DN-2026");
export const nextRefundNumber = () => nextSequential("refundPrefix", "nextRefundNumber", "RF-2026");
export const nextAdjustmentNumber = () =>
  nextSequential("adjustmentPrefix", "nextAdjustmentNumber", "ADJ-2026");

async function nextNumber(kind: string, fallback: () => string): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/next-number.php`, {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify({ kind }),
    });
    if (!res.ok) throw new Error(`Failed to get next ${kind} number: ${res.status}`);
    const data = (await res.json()) as { number: string; settings?: CompanySettings };
    if (data.settings) saveSettings(data.settings);
    return data.number;
  } catch (error) {
    console.error(error);
    return fallback();
  }
}

export const nextInvoiceNumberAsync = () => nextNumber("invoice", nextInvoiceNumber);
export const nextVoucherNumberAsync = () => nextNumber("voucher", nextVoucherNumber);
export const nextPaymentNumberAsync = () => nextNumber("payment", nextPaymentNumber);
export const nextCreditNoteNumberAsync = () => nextNumber("creditNote", nextCreditNoteNumber);
export const nextDebitNoteNumberAsync = () => nextNumber("debitNote", nextDebitNoteNumber);
export const nextRefundNumberAsync = () => nextNumber("refund", nextRefundNumber);
export const nextAdjustmentNumberAsync = () => nextNumber("adjustment", nextAdjustmentNumber);

export const emptyClient = (): Client => ({
  id: uid(),
  type: "company",
  name: "",
  contactPerson: "",
  address: "",
  taxId: "",
  accountNumber: "",
  email: "",
  phone: "",
  notes: "",
});
export const emptySupplier = (): Supplier => ({
  id: uid(),
  type: "other",
  name: "",
  address: "",
  phone: "",
  email: "",
  notes: "",
});
export const emptyServiceItem = (type: ServiceType = "hotel"): ServiceItem => ({
  id: uid(),
  type,
  description: "",
  passengerName: "",
  bookingRef: "",
  supplierRef: "",
  startDate: "",
  endDate: "",
  quantity: 1,
  unit: "",
  unitPrice: 0,
  total: 0,
  notes: "",
  meta: {},
});
