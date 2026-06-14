import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Save, Download, Printer, Plus, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { uid, useStatements, type Statement, type StatementTxn } from "@/lib/storage";
import { StatementPreview } from "@/components/doc/StatementPreview";
import { exportElementToPdf, printElement, sanitizeFilenamePart } from "@/lib/pdf";
import { LanguageToggle } from "@/components/doc/LanguageToggle";
import type { Lang } from "@/lib/i18n";

function Field({
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

export function StatementEditor({ initial }: { initial: Statement }) {
  const [st, setSt] = useState<Statement>(initial);
  const [statements, setStatements] = useStatements();
  const [lang, setLang] = useState<Lang>("en");
  const ref = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  const patch = (p: Partial<Statement>) => setSt((s) => ({ ...s, ...p }));

  const save = () => {
    setStatements((prev) => {
      const ix = prev.findIndex((p) => p.id === st.id);
      if (ix === -1) return [st, ...prev];
      const next = [...prev];
      next[ix] = st;
      return next;
    });
    toast.success("Statement saved");
  };
  const remove = () => {
    if (!confirm("Delete this statement?")) return;
    setStatements((prev) => prev.filter((p) => p.id !== st.id));
    nav("/documents");
  };
  const duplicate = () => {
    const dup = { ...st, id: uid(), createdAt: new Date().toISOString() };
    setStatements((prev) => [dup, ...prev]);
    nav(`/statements/${dup.id}`);
  };
  const download = async () => {
    save();
    if (!ref.current) return;
    const name = `ELBAKRI-SOA-${sanitizeFilenamePart(st.customerName || st.accountName)}-${sanitizeFilenamePart(`${st.periodFrom}_${st.periodTo}`)}`;
    await exportElementToPdf(ref.current, name, "landscape");
  };
  const doPrint = () => {
    if (ref.current) printElement(ref.current);
  };

  const addTxn = () =>
    patch({
      transactions: [
        ...st.transactions,
        {
          id: uid(),
          date: new Date().toISOString().slice(0, 10),
          voucher: "",
          invoice: "",
          description: "",
          debit: 0,
          credit: 0,
        } as StatementTxn,
      ],
    });
  const updateTxn = (id: string, p: Partial<StatementTxn>) =>
    patch({
      transactions: st.transactions.map((t) => (t.id === id ? { ...t, ...p } : t)),
    });
  const removeTxn = (id: string) =>
    patch({ transactions: st.transactions.filter((t) => t.id !== id) });

  return (
    <div className="flex flex-col xl:flex-row min-h-[calc(100vh-3.5rem)]">
      <section className="editor-pane xl:w-[680px] xl:border-r p-4 space-y-3 overflow-y-auto">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold">
            {statements.some((s) => s.id === st.id) ? "Edit" : "New"} Statement of Account
          </h1>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={duplicate}>
              <Copy />
              Duplicate
            </Button>
            <Button size="sm" variant="outline" onClick={remove} className="text-destructive">
              <Trash2 />
            </Button>
            <Button size="sm" onClick={save} className="bg-navy text-navy-foreground">
              <Save />
              Save
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-5 grid grid-cols-2 gap-3">
            <Field label="Customer / agency" className="col-span-2">
              <Input
                value={st.customerName}
                onChange={(e) => patch({ customerName: e.target.value })}
              />
            </Field>
            <Field label="Account name">
              <Input
                value={st.accountName}
                onChange={(e) => patch({ accountName: e.target.value })}
              />
            </Field>
            <Field label="Account number">
              <Input
                value={st.accountNumber}
                onChange={(e) => patch({ accountNumber: e.target.value })}
              />
            </Field>
            <Field label="Currency">
              <Select value={st.currency} onValueChange={(v) => patch({ currency: v as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["USD", "EUR", "EGP", "SAR", "AED"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Prepared by">
              <Input
                value={st.preparedBy}
                onChange={(e) => patch({ preparedBy: e.target.value })}
              />
            </Field>
            <Field label="Period from">
              <Input
                type="date"
                value={st.periodFrom}
                onChange={(e) => patch({ periodFrom: e.target.value })}
              />
            </Field>
            <Field label="Period to">
              <Input
                type="date"
                value={st.periodTo}
                onChange={(e) => patch({ periodTo: e.target.value })}
              />
            </Field>
            <Field label="Opening balance" className="col-span-2">
              <Input
                type="number"
                step="0.01"
                value={st.openingBalance}
                onChange={(e) => patch({ openingBalance: Number(e.target.value) })}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Transactions ({st.transactions.length})</div>
              <Button size="sm" variant="outline" onClick={addTxn}>
                <Plus />
                Add
              </Button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {st.transactions.map((t) => (
                <div key={t.id} className="border rounded p-2 grid grid-cols-12 gap-2 items-end">
                  <Field label="Date" className="col-span-3">
                    <Input
                      type="date"
                      value={t.date}
                      onChange={(e) => updateTxn(t.id, { date: e.target.value })}
                    />
                  </Field>
                  <Field label="Voucher" className="col-span-3">
                    <Input
                      value={t.voucher}
                      onChange={(e) => updateTxn(t.id, { voucher: e.target.value })}
                    />
                  </Field>
                  <Field label="Invoice" className="col-span-3">
                    <Input
                      value={t.invoice}
                      onChange={(e) => updateTxn(t.id, { invoice: e.target.value })}
                    />
                  </Field>
                  <div className="col-span-3 flex justify-end">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => removeTxn(t.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <Field label="Description" className="col-span-12">
                    <Textarea
                      rows={2}
                      value={t.description}
                      onChange={(e) => updateTxn(t.id, { description: e.target.value })}
                    />
                  </Field>
                  <Field label="Debit" className="col-span-6">
                    <Input
                      type="number"
                      step="0.01"
                      value={t.debit}
                      onChange={(e) => updateTxn(t.id, { debit: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Credit" className="col-span-6">
                    <Input
                      type="number"
                      step="0.01"
                      value={t.credit}
                      onChange={(e) => updateTxn(t.id, { credit: Number(e.target.value) })}
                    />
                  </Field>
                </div>
              ))}
              {st.transactions.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No transactions yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="doc-preview-pane flex-1 bg-muted/30 overflow-y-auto">
        <div className="doc-preview-toolbar sticky top-0 z-10 bg-background/90 backdrop-blur border-b px-4 py-2 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium">Live preview (A4 landscape)</div>
            <LanguageToggle lang={lang} onChange={setLang} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={doPrint}>
              <Printer />
              Print
            </Button>
            <Button size="sm" onClick={download} className="bg-navy text-navy-foreground">
              <Download />
              Download PDF
            </Button>
          </div>
        </div>
        <div className="doc-preview-scroll">
          <div className="doc-preview-inner p-6 flex justify-center">
            <div ref={ref}>
              <StatementPreview statement={st} lang={lang} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function buildBlankStatement(): Statement {
  const today = new Date().toISOString().slice(0, 10);
  const firstDay = new Date();
  firstDay.setDate(1);
  return {
    id: uid(),
    kind: "statement",
    accountName: "",
    accountNumber: "",
    customerName: "",
    currency: "USD",
    periodFrom: firstDay.toISOString().slice(0, 10),
    periodTo: today,
    preparedBy: "",
    openingBalance: 0,
    transactions: [],
    createdAt: new Date().toISOString(),
  };
}
