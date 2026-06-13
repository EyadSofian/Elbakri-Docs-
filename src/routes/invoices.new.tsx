import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getSettings, nextInvoiceNumber, useInvoices } from "@/lib/storage";
import { buildBlankInvoice } from "@/components/doc/InvoiceEditor";

export const Route = createFileRoute("/invoices/new")({
  head: () => ({ meta: [{ title: "New Invoice — Elbakri Overseas" }] }),
  component: NewInvoice,
});

function NewInvoice() {
  const [, setInvoices] = useInvoices();
  const nav = useNavigate();
  useEffect(() => {
    const settings = getSettings();
    const number = nextInvoiceNumber();
    const inv = buildBlankInvoice({ number, defaults: settings });
    setInvoices(prev => [inv, ...prev]);
    nav({ to: "/invoices/$id", params: { id: inv.id }, replace: true });
  }, []);
  return <div className="p-6 text-sm text-muted-foreground">Creating invoice…</div>;
}
