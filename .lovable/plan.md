# Client Ledger, Payment Allocation & Consolidated Client Invoice

## Scope

Extend the existing accounts module into a true double-entry-style ledger with proper transaction types, manual payment allocation, credit/debit notes, refunds, cancellations, manual adjustments, opening balances, and a new invoice-style "Consolidated Client Invoice" PDF.

---

## 1. Data model (`src/lib/storage.ts`)

Extend existing types:

- `Payment` — already exists, keep. Add `unappliedAmount` derived helper. Ensure `allocations[]` is the source of truth.
- `CreditNote` — add `relatedInvoiceId?`, `reason`, `appliedAmount` (auto-allocated like payment when linked to invoice).
- New `DebitNote` — `{id, number, clientId, date, amount, currency, relatedInvoiceId?, reason, notes}`.
- New `Refund` — `{id, number, clientId, date, amount, currency, method, reference, notes}`.
- New `ManualAdjustment` — `{id, number, clientId, date, amount, currency, direction: "debit"|"credit", reason, notes}`.
- New `OpeningBalance` — stored on Client as `{openingBalance: number, openingBalanceDate: string, openingBalanceCurrency: Currency}`.

Add hooks: `useDebitNotes`, `useRefunds`, `useAdjustments`. Add numbering helpers: `nextDebitNoteNumber`, `nextRefundNumber`, `nextAdjustmentNumber`.

Invoice cancellation behavior: cancelling an invoice keeps the invoice with status `Cancelled` (excluded from balance). Optional "cancel as credit note" flow creates a CreditNote of full remaining and links it.

---

## 2. Ledger engine (`src/lib/account.ts`)

Rewrite `buildLedger` to include all transaction types with proper Debit/Credit columns:

```text
Invoice          → Debit
Debit Note       → Debit
Refund           → Debit
Opening (Dr)     → Debit
Payment Receipt  → Credit
Credit Note      → Credit
Cancellation     → Credit (reverses invoice amount)
Manual Adj.      → Either
```

Running balance = Σ Debit − Σ Credit.

Add `computeInvoiceLedger(invoice)` returning `{original, paid, creditApplied, cancelled, remaining, status}` consumed by both the invoice list and the consolidated document.

Update `computeClientAccount` totals to include: `totalDebitNotes`, `totalRefunds`, `totalAdjustments`, `creditBalance` (unallocated payments + unlinked credit notes − unlinked debit notes), updated aging.

---

## 3. Payment dialog v2 (`src/components/account/PaymentDialog.tsx`)

Replace strategy dropdown with a full allocation table:

| Select | Inv # | Date | Due | Total | Paid | Remaining | Apply | Status |

- Header inputs: date, amount, currency, method (Bank Transfer / Cash / Card / Vodafone Cash / Instapay / Other), reference, notes.
- Quick buttons: "Auto-allocate oldest first", "Clear", "Save as advance only".
- Per-row "Apply" input editable; live validation:
  - Σ apply ≤ payment amount
  - per-row apply ≤ remaining
- Footer shows: Applied, Unapplied → Client Credit, Remaining payment.
- Save → writes Payment with allocations and any unapplied amount becomes credit balance automatically (no extra record needed; derived).

---

## 4. New dialogs

- `CreditNoteDialog.tsx` — fields per spec, optional invoice link (combobox of client's invoices), reason dropdown.
- `DebitNoteDialog.tsx` — same shape, increases balance.
- `RefundDialog.tsx` — minimal: amount, method, reference, notes.
- `AdjustmentDialog.tsx` — direction toggle, reason, notes.
- `OpeningBalanceDialog.tsx` — set/edit opening balance on client.

All share validation and toast confirmations.

---

## 5. Client account page (`src/routes/accounts.$id.tsx`)

New tab structure:
1. **Overview** — KPI cards: Total Invoiced, Total Paid, Total Credit Notes, Total Debit Notes, Outstanding, Credit Balance, Overdue, plus invoice status counts.
2. **Invoices** — list with Original / Paid / Credit / Cancelled / Remaining / Status; row actions: Record Payment for this invoice, Issue Credit Note, Issue Debit Note, Cancel.
3. **Payments** — list with applied invoices breakdown; row click expands allocation detail.
4. **Credit/Debit Notes** — combined list with type chip.
5. **Ledger** — full chronological table: Date | Type | Doc # | Related Invoice | Description | Debit | Credit | Running Balance | Status.
6. **Aging** — existing buckets.

Top action bar: Record Payment · Credit Note · Debit Note · Refund · Adjustment · Opening Balance · Export Consolidated Invoice · Statement of Account.

---

## 6. Consolidated Client Invoice (new document)

New component `src/components/account/ConsolidatedClientInvoicePreview.tsx` and route `src/routes/accounts.$id.consolidated.tsx`.

### Selection screen
Before preview, modal/inline filter:
- Date range (period from/to)
- Status filter checkboxes: All / Unpaid / Partial / Overdue / Paid / Cancelled (defaults: Unpaid + Partial + Overdue)
- Include payment history (default on)
- Include credit notes section (default on)
- Include previous balance (default off)
- Manual invoice multi-select override
- Language: EN / AR
- Currency (auto from client)

### Document layout (invoice-style, not ledger)
1. Header with logo, company info, title (EN: "CONSOLIDATED CLIENT INVOICE", AR: "فاتورة مجمعة للعميل"), client/agency block, account #, currency, date, period, prepared by.
2. **Summary box** (prominent, navy): Total Invoiced, Total Paid, Total Credit Notes, Total Cancelled, Previous Balance, Current Remaining, **Final Amount Due** (large).
3. **Invoice breakdown table**: Inv # | Date | Booking Ref | Service | Original | Paid | Credit | Cancelled | Remaining | Status badge.
4. **Payment history** (optional): Date | Payment # | Method | Reference | Applied Invoice(s) | Amount | Notes.
5. **Credit notes** (optional): Date | CN # | Related Invoice | Reason | Amount.
6. **Final amount due box**: huge "Total Amount Due Now" + currency, payment instructions (bank, IBAN, SWIFT from settings), due date, notes.
7. Footer with signature block.

### Calculation rules
Per invoice:
```
paid       = Σ payment allocations
credit     = Σ credit note amounts linked to invoice
cancelled  = invoice.status === "Cancelled" ? original : 0
remaining  = max(0, original − paid − credit − cancelled)
```
Final Due = Σ remaining for included non-cancelled invoices + previousBalance (if included).

### Export
Reuse `exportElementToPdf` from `src/lib/pdf.ts`. Add Preview / Download PDF / Print buttons; bilingual via existing `LanguageToggle`. Filename: `Consolidated-Invoice_<ClientSlug>_<YYYYMMDD>.pdf`.

---

## 7. i18n (`src/lib/i18n.ts`)

Add EN/AR keys for: all new transaction types, payment methods (Vodafone Cash, Instapay), credit/debit note reasons, consolidated invoice labels/columns/statuses, summary box labels, "Total Amount Due Now", filter selection labels.

---

## 8. Sidebar / nav

No new top-level routes besides `accounts.$id.consolidated`. Keep existing `/accounts` and `/accounts/$id` entry points.

---

## 9. Out of scope

- Multi-currency conversion (one currency per ledger view, as today).
- Server-side persistence (still localStorage).
- Editing past payments — only delete + re-create (with confirm).

---

## Technical files touched

- Edit: `src/lib/storage.ts`, `src/lib/account.ts`, `src/lib/i18n.ts`, `src/routes/accounts.$id.tsx`, `src/components/account/PaymentDialog.tsx`, `src/components/account/ConsolidatedInvoicePreview.tsx` (kept for backwards link), `src/components/app-sidebar.tsx`.
- New: `src/components/account/CreditNoteDialog.tsx`, `DebitNoteDialog.tsx`, `RefundDialog.tsx`, `AdjustmentDialog.tsx`, `OpeningBalanceDialog.tsx`, `ConsolidatedClientInvoicePreview.tsx`, `ConsolidatedInvoiceFilters.tsx`, `src/routes/accounts.$id.consolidated.tsx`.

After implementation I'll smoke-test the flow in the preview: create invoice → record partial payment with manual allocation → issue credit note → cancel invoice → open Ledger tab → generate Consolidated Client Invoice PDF in EN and AR.
