import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getSettingsAsync, nextInvoiceNumberAsync, useInvoices } from "@/lib/storage";
import { buildBlankInvoice } from "@/components/doc/InvoiceEditor";

export const Route = createFileRoute("/invoices/new")({
  head: () => ({ meta: [{ title: "New Invoice — Elbakri Overseas" }] }),
  component: NewInvoice,
});

function NewInvoice() {
  const [, setInvoices] = useInvoices();
  const nav = useNavigate();
  useEffect(() => {
    void (async () => {
      const settings = await getSettingsAsync();
      const number = await nextInvoiceNumberAsync();
      const inv = buildBlankInvoice({ number, defaults: settings });
      setInvoices((prev) => [inv, ...prev]);
      nav({ to: "/invoices/$id", params: { id: inv.id }, replace: true });
    })();
  }, [nav, setInvoices]);
  return <div className="p-6 text-sm text-muted-foreground">Creating invoice…</div>;
}
