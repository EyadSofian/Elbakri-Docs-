import { useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInvoices, usePayments, useCreditNotes } from "@/lib/storage";
import { BalanceDueInvoicePreview } from "@/components/doc/BalanceDueInvoicePreview";
import { LanguageToggle } from "@/components/doc/LanguageToggle";
import { exportElementToPdf, printElement, sanitizeFilenamePart } from "@/lib/pdf";
import type { Lang } from "@/lib/i18n";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function BalanceDuePage() {
  useDocumentTitle("Balance Due Invoice — Elbakri Overseas");
  const { id } = useParams();
  const [invoices] = useInvoices();
  const [payments] = usePayments();
  const [creditNotes] = useCreditNotes();
  const [lang, setLang] = useState<Lang>("en");
  const previewRef = useRef<HTMLDivElement>(null);

  const invoice = invoices.find((i) => i.id === id);

  const clientPayments = useMemo(
    () =>
      invoice
        ? payments.filter((p) => p.clientId === invoice.clientId && p.currency === invoice.currency)
        : [],
    [invoice, payments],
  );
  const clientCreditNotes = useMemo(
    () =>
      invoice
        ? creditNotes.filter(
            (c) => c.clientId === invoice.clientId && c.currency === invoice.currency,
          )
        : [],
    [invoice, creditNotes],
  );

  if (!invoice) {
    return (
      <div className="p-8 text-center">
        <div className="text-muted-foreground">Invoice not found.</div>
        <Link to="/documents" className="underline doc-navy">
          Back to saved documents
        </Link>
      </div>
    );
  }

  const downloadPdf = async () => {
    if (!previewRef.current) return;
    const tag = lang === "ar" ? "BALANCE-DUE-AR" : "BALANCE-DUE";
    const name = `ELBAKRI-${tag}-${sanitizeFilenamePart(invoice.number)}-${sanitizeFilenamePart(invoice.client.name)}`;
    await exportElementToPdf(previewRef.current, name, "portrait");
  };
  const doPrint = () => {
    if (previewRef.current) printElement(previewRef.current);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      <div className="doc-preview-toolbar sticky top-0 z-10 bg-background/90 backdrop-blur border-b px-4 py-2 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link
            to={`/invoices/${invoice.id}`}
            className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="size-3.5" /> Back to invoice
          </Link>
          <div className="text-sm font-medium">Balance Due Invoice · {invoice.number}</div>
          <LanguageToggle lang={lang} onChange={setLang} />
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={doPrint}>
            <Printer />
            Print
          </Button>
          <Button size="sm" onClick={downloadPdf} className="bg-navy text-navy-foreground">
            <Download />
            Download PDF
          </Button>
        </div>
      </div>
      <div className="doc-preview-pane bg-muted/30 flex-1 overflow-y-auto">
        <div className="doc-preview-scroll">
          <div className="doc-preview-inner p-6 flex justify-center">
            <div ref={previewRef}>
              <BalanceDueInvoicePreview
                invoice={invoice}
                payments={clientPayments}
                creditNotes={clientCreditNotes}
                lang={lang}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
