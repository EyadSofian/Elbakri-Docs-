import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { nextVoucherNumber, useVouchers } from "@/lib/storage";
import { buildBlankVoucher } from "@/components/doc/VoucherEditor";

export const Route = createFileRoute("/vouchers/new")({
  head: () => ({ meta: [{ title: "New Voucher — Elbakri Overseas" }] }),
  component: NewVoucher,
});

function NewVoucher() {
  const [, setVouchers] = useVouchers();
  const nav = useNavigate();
  useEffect(() => {
    const v = buildBlankVoucher({ number: nextVoucherNumber() });
    setVouchers(prev => [v, ...prev]);
    nav({ to: "/vouchers/$id", params: { id: v.id }, replace: true });
  }, []);
  return <div className="p-6 text-sm text-muted-foreground">Creating voucher…</div>;
}

