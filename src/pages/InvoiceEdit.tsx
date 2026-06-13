import { useParams, Link } from "react-router-dom";
import { useInvoices } from "@/lib/storage";
import { InvoiceEditor } from "@/components/doc/InvoiceEditor";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function EditInvoicePage() {
  useDocumentTitle("Invoice — Elbakri Overseas");
  const { id } = useParams();
  const [invoices] = useInvoices();
  const invoice = invoices.find((i) => i.id === id);
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
  return <InvoiceEditor key={invoice.id} initial={invoice} />;
}
