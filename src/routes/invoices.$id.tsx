import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useInvoices } from "@/lib/storage";
import { InvoiceEditor } from "@/components/doc/InvoiceEditor";

export const Route = createFileRoute("/invoices/$id")({
  head: () => ({ meta: [{ title: "Invoice — Elbakri Overseas" }] }),
  component: EditInvoicePage,
});

function EditInvoicePage() {
  const { id } = useParams({ from: "/invoices/$id" });
  const [invoices] = useInvoices();
  const invoice = invoices.find(i => i.id === id);
  if (!invoice) {
    return (
      <div className="p-8 text-center">
        <div className="text-muted-foreground">Invoice not found.</div>
        <Link to="/documents" className="underline doc-navy">Back to saved documents</Link>
      </div>
    );
  }
  return <InvoiceEditor key={invoice.id} initial={invoice} />;
}
