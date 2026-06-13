import { useParams, Link } from "react-router-dom";
import { useVouchers } from "@/lib/storage";
import { VoucherEditor } from "@/components/doc/VoucherEditor";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function EditVoucherPage() {
  useDocumentTitle("Voucher — Elbakri Overseas");
  const { id } = useParams();
  const [vouchers] = useVouchers();
  const voucher = vouchers.find((v) => v.id === id);
  if (!voucher)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Voucher not found.{" "}
        <Link to="/documents" className="underline">
          Back
        </Link>
      </div>
    );
  return <VoucherEditor key={voucher.id} initial={voucher} />;
}
