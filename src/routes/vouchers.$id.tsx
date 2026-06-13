import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useVouchers } from "@/lib/storage";
import { VoucherEditor } from "@/components/doc/VoucherEditor";

export const Route = createFileRoute("/vouchers/$id")({
  head: () => ({ meta: [{ title: "Voucher — Elbakri Overseas" }] }),
  component: EditVoucherPage,
});

function EditVoucherPage() {
  const { id } = useParams({ from: "/vouchers/$id" });
  const [vouchers] = useVouchers();
  const voucher = vouchers.find(v => v.id === id);
  if (!voucher) return <div className="p-8 text-center text-muted-foreground">Voucher not found. <Link to="/documents" className="underline">Back</Link></div>;
  return <VoucherEditor key={voucher.id} initial={voucher} />;
}
