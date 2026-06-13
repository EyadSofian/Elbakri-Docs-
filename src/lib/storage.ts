// Local-storage backed persistence for Elbakri Overseas internal app.
import { useEffect, useState, useCallback } from "react";

export type Currency = "EGP" | "USD" | "EUR" | "SAR" | "AED";
export type DocStatus = "Draft" | "Unpaid" | "Paid" | "Partial" | "Overdue" | "Cancelled";
export type ServiceType =
  | "hotel" | "tour" | "activity" | "transfer"
  | "sim" | "visa" | "flight" | "package" | "other";

export type PaymentMethod =
  | "bank_transfer" | "cash" | "card" | "vodafone_cash" | "instapay" | "other";

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
  name: string;
  address: string;
  taxId: string;
  email: string;
  phone: string;
  notes: string;
  openingBalance?: number;
  openingBalanceDate?: string;
  openingBalanceCurrency?: Currency;
}


export interface Supplier {
  id: string;
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
  number: string;            // e.g. PAY-2026-0001
  clientId: string;          // owner of the payment
  date: string;              // ISO date
  currency: Currency;
  amount: number;            // total received
  method: PaymentMethod;
  reference: string;         // external ref
  notes: string;
  allocations: PaymentAllocation[]; // sum may be < amount (rest = client credit)
  createdAt: string;
}

export const CREDIT_NOTE_REASONS = [
  "discount", "cancelled_service", "price_correction",
  "refund_adjustment", "supplier_issue", "manual_adjustment", "other",
] as const;
export type CreditNoteReason = typeof CREDIT_NOTE_REASONS[number];

export const DEBIT_NOTE_REASONS = [
  "extra_charge", "price_correction", "penalty", "service_addition",
  "manual_adjustment", "other",
] as const;
export type DebitNoteReason = typeof DEBIT_NOTE_REASONS[number];

export interface CreditNote {
  id: string;
  number: string;
  clientId: string;
  date: string;
  currency: Currency;
  amount: number;
  reason: CreditNoteReason | string;
  notes?: string;
  invoiceId?: string;        // optional related invoice
  createdAt: string;
}

export interface DebitNote {
  id: string;
  number: string;            // e.g. DN-2026-0001
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
  number: string;            // RF-2026-0001
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
  number: string;            // ADJ-2026-0001
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
  checkIn: string;
  checkOut: string;
  rateBasis: string;
  remarks: string;
  checkInRestrictions: string;
  ageRequirements: string;
  petsPolicy: string;
  frontDeskNotes: string;
  identificationRequirements: string;
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


function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new StorageEvent("storage", { key }));
}

export function uid() {
  return (globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

function useLS<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => read(key, fallback));
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setValue(read(key, fallback));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const update = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      write(key, v);
      return v;
    });
  }, [key]);
  return [value, update] as const;
}

export const useInvoices    = () => useLS<Invoice[]>(KEYS.invoices, []);
export const useVouchers    = () => useLS<Voucher[]>(KEYS.vouchers, []);
export const useStatements  = () => useLS<Statement[]>(KEYS.statements, []);
export const useClients     = () => useLS<Client[]>(KEYS.clients, []);
export const useSuppliers   = () => useLS<Supplier[]>(KEYS.suppliers, []);
export const useTemplates   = () => useLS<ServiceTemplate[]>(KEYS.templates, []);
export const useSettings    = () => useLS<CompanySettings>(KEYS.settings, DEFAULT_SETTINGS);
export const usePayments    = () => useLS<Payment[]>(KEYS.payments, []);
export const useCreditNotes = () => useLS<CreditNote[]>(KEYS.creditNotes, []);
export const useDebitNotes  = () => useLS<DebitNote[]>(KEYS.debitNotes, []);
export const useRefunds     = () => useLS<Refund[]>(KEYS.refunds, []);
export const useAdjustments = () => useLS<ManualAdjustment[]>(KEYS.adjustments, []);

export function getSettings(): CompanySettings {
  return { ...DEFAULT_SETTINGS, ...read(KEYS.settings, DEFAULT_SETTINGS) };
}
export function saveSettings(s: CompanySettings) {
  write(KEYS.settings, s);
}

function nextSequential(prefixField: keyof CompanySettings, numField: keyof CompanySettings, defaultPrefix: string): string {
  const s = getSettings();
  const prefix = (s[prefixField] as string) || defaultPrefix;
  const n = (s[numField] as number) || 1;
  const num = `${prefix}-${String(n).padStart(4, "0")}`;
  saveSettings({ ...s, [prefixField]: prefix, [numField]: n + 1 } as CompanySettings);
  return num;
}
export const nextInvoiceNumber    = () => { const s = getSettings(); const num = `${s.invoicePrefix}-${String(s.nextInvoiceNumber).padStart(4,"0")}`; saveSettings({ ...s, nextInvoiceNumber: s.nextInvoiceNumber + 1 }); return num; };
export const nextVoucherNumber    = () => { const s = getSettings(); const num = `${s.voucherPrefix}-${String(s.nextVoucherNumber).padStart(4,"0")}`; saveSettings({ ...s, nextVoucherNumber: s.nextVoucherNumber + 1 }); return num; };
export const nextPaymentNumber    = () => nextSequential("paymentPrefix",    "nextPaymentNumber",    "PAY-2026");
export const nextCreditNoteNumber = () => nextSequential("creditNotePrefix", "nextCreditNoteNumber", "CN-2026");
export const nextDebitNoteNumber  = () => nextSequential("debitNotePrefix",  "nextDebitNoteNumber",  "DN-2026");
export const nextRefundNumber     = () => nextSequential("refundPrefix",     "nextRefundNumber",     "RF-2026");
export const nextAdjustmentNumber = () => nextSequential("adjustmentPrefix", "nextAdjustmentNumber", "ADJ-2026");


export const emptyClient = (): Client => ({
  id: uid(), name: "", address: "", taxId: "", email: "", phone: "", notes: "",
});
export const emptySupplier = (): Supplier => ({
  id: uid(), name: "", address: "", phone: "", email: "", notes: "",
});
export const emptyServiceItem = (type: ServiceType = "hotel"): ServiceItem => ({
  id: uid(), type, description: "", passengerName: "", bookingRef: "", supplierRef: "",
  startDate: "", endDate: "", quantity: 1, unit: "", unitPrice: 0, total: 0, notes: "", meta: {},
});
