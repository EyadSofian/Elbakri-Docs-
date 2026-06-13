import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getSettingsAsync, nextInvoiceNumberAsync, useInvoices } from "@/lib/storage";
import { buildBlankInvoice } from "@/components/doc/InvoiceEditor";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function NewInvoice() {
  useDocumentTitle("New Invoice — Elbakri Overseas");
  const [, setInvoices] = useInvoices();
  const navigate = useNavigate();
  // Create exactly one invoice, even though StrictMode invokes mount effects
  // twice in development. Without the ref guard the effect would create (and
  // navigate to) two invoices.
  const createdRef = useRef(false);

  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;
    void (async () => {
      const settings = await getSettingsAsync();
      const number = await nextInvoiceNumberAsync();
      const inv = buildBlankInvoice({ number, defaults: settings });
      setInvoices((prev) => [inv, ...prev]);
      navigate(`/invoices/${inv.id}`, { replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="p-6 text-sm text-muted-foreground">Creating invoice…</div>;
}
