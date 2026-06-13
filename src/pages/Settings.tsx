import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save } from "lucide-react";
import { useSettings, type CompanySettings, type Currency } from "@/lib/storage";
import { toast } from "sonner";
import { useDocumentTitle } from "@/lib/use-document-title";

const logoUrl = "/elbakri-logo.svg";

export default function SettingsPage() {
  useDocumentTitle("Company Settings — Elbakri Overseas");
  const [settings, setSettings] = useSettings();
  const [s, setS] = useState<CompanySettings>(settings);
  const save = () => {
    setSettings(s);
    toast.success("Settings saved");
  };
  const patch = (p: Partial<CompanySettings>) => setS((prev) => ({ ...prev, ...p }));
  const patchBank = (p: Partial<CompanySettings["defaultBank"]>) =>
    setS((prev) => ({ ...prev, defaultBank: { ...prev.defaultBank, ...p } }));

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Company Settings</h1>
          <p className="text-sm text-muted-foreground">
            Header, footer, bank defaults and document numbering.
          </p>
        </div>
        <Button onClick={save} className="bg-navy text-navy-foreground">
          <Save />
          Save settings
        </Button>
      </header>

      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center gap-4 pb-3 border-b">
            <img
              src={logoUrl}
              alt="Elbakri"
              className="h-16 w-16 object-contain bg-white rounded border p-1"
            />
            <div>
              <div className="font-semibold doc-navy">{s.name}</div>
              <div className="text-xs text-muted-foreground">
                Logo is fixed across all documents.
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Company name">
              <Input value={s.name} onChange={(e) => patch({ name: e.target.value })} />
            </F>
            <F label="Tagline">
              <Input value={s.tagline} onChange={(e) => patch({ tagline: e.target.value })} />
            </F>
            <F label="Established (year)">
              <Input
                value={s.established}
                onChange={(e) => patch({ established: e.target.value })}
              />
            </F>
            <F label="Default currency">
              <Select
                value={s.defaultCurrency}
                onValueChange={(v) => patch({ defaultCurrency: v as Currency })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["USD", "EUR", "EGP", "SAR", "AED"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </F>
            <F label="Address" className="col-span-2">
              <Textarea
                rows={2}
                value={s.address}
                onChange={(e) => patch({ address: e.target.value })}
              />
            </F>
            <F label="Phone">
              <Input value={s.phone} onChange={(e) => patch({ phone: e.target.value })} />
            </F>
            <F label="Email">
              <Input value={s.email} onChange={(e) => patch({ email: e.target.value })} />
            </F>
            <F label="Website">
              <Input value={s.website} onChange={(e) => patch({ website: e.target.value })} />
            </F>
            <F label="Tax ID">
              <Input value={s.taxId} onChange={(e) => patch({ taxId: e.target.value })} />
            </F>
            <F label="Commercial register" className="col-span-2">
              <Input
                value={s.commercialRegister}
                onChange={(e) => patch({ commercialRegister: e.target.value })}
              />
            </F>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="font-semibold">Default bank details</div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Bank name">
              <Input
                value={s.defaultBank.bankName}
                onChange={(e) => patchBank({ bankName: e.target.value })}
              />
            </F>
            <F label="Account number">
              <Input
                value={s.defaultBank.accountNumber}
                onChange={(e) => patchBank({ accountNumber: e.target.value })}
              />
            </F>
            <F label="IBAN">
              <Input
                value={s.defaultBank.iban}
                onChange={(e) => patchBank({ iban: e.target.value })}
              />
            </F>
            <F label="SWIFT">
              <Input
                value={s.defaultBank.swift}
                onChange={(e) => patchBank({ swift: e.target.value })}
              />
            </F>
            <F label="Payment notes" className="col-span-2">
              <Textarea
                rows={2}
                value={s.defaultBank.notes}
                onChange={(e) => patchBank({ notes: e.target.value })}
              />
            </F>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="font-semibold">Document numbering</div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Invoice prefix">
              <Input
                value={s.invoicePrefix}
                onChange={(e) => patch({ invoicePrefix: e.target.value })}
              />
            </F>
            <F label="Next invoice number">
              <Input
                type="number"
                min={1}
                value={s.nextInvoiceNumber}
                onChange={(e) => patch({ nextInvoiceNumber: Number(e.target.value) })}
              />
            </F>
            <F label="Voucher prefix">
              <Input
                value={s.voucherPrefix}
                onChange={(e) => patch({ voucherPrefix: e.target.value })}
              />
            </F>
            <F label="Next voucher number">
              <Input
                type="number"
                min={1}
                value={s.nextVoucherNumber}
                onChange={(e) => patch({ nextVoucherNumber: Number(e.target.value) })}
              />
            </F>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
function F({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
