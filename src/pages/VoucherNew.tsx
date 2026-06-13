import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { nextVoucherNumberAsync, useVouchers } from "@/lib/storage";
import { buildBlankVoucher } from "@/components/doc/VoucherEditor";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function NewVoucher() {
  useDocumentTitle("New Voucher — Elbakri Overseas");
  const [, setVouchers] = useVouchers();
  const navigate = useNavigate();
  // See InvoiceNew: ref guard keeps the create-and-navigate effect to a single
  // run under StrictMode's development double-invoke.
  const createdRef = useRef(false);

  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;
    void (async () => {
      const v = buildBlankVoucher({ number: await nextVoucherNumberAsync() });
      setVouchers((prev) => [v, ...prev]);
      navigate(`/vouchers/${v.id}`, { replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="p-6 text-sm text-muted-foreground">Creating voucher…</div>;
}
