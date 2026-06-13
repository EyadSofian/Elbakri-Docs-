import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { nextVoucherNumberAsync, useVouchers } from "@/lib/storage";
import { buildBlankVoucher } from "@/components/doc/VoucherEditor";

export const Route = createFileRoute("/vouchers/new")({
  head: () => ({ meta: [{ title: "New Voucher — Elbakri Overseas" }] }),
  component: NewVoucher,
});

function NewVoucher() {
  const [, setVouchers] = useVouchers();
  const nav = useNavigate();
  useEffect(() => {
    void (async () => {
      const v = buildBlankVoucher({ number: await nextVoucherNumberAsync() });
      setVouchers((prev) => [v, ...prev]);
      nav({ to: "/vouchers/$id", params: { id: v.id }, replace: true });
    })();
    // Run exactly once on mount — see invoices.new for why nav/setVouchers must
    // NOT be dependencies (infinite create-and-navigate loop that froze the tab).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div className="p-6 text-sm text-muted-foreground">Creating voucher…</div>;
}
