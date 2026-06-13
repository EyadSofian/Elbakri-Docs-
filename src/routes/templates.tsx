import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit3, Save, X } from "lucide-react";
import { useTemplates, type ServiceTemplate, uid, SERVICE_TYPES } from "@/lib/storage";
import { toast } from "sonner";

const empty = (): ServiceTemplate => ({
  id: uid(), name: "", type: "hotel", description: "", unit: "", unitPrice: 0, meta: {}, notes: "",
});

export const Route = createFileRoute("/templates")({
  head: () => ({ meta: [{ title: "Service Templates — Elbakri Overseas" }] }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const [list, setList] = useTemplates();
  const [editing, setEditing] = useState<ServiceTemplate | null>(null);

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) return toast.error("Name required");
    setList(prev => {
      const ix = prev.findIndex(c => c.id === editing.id);
      if (ix === -1) return [editing, ...prev];
      const n = [...prev]; n[ix] = editing; return n;
    });
    setEditing(null);
    toast.success("Saved");
  };

  return (
    <div className="p-6 space-y-4 max-w-6xl mx-auto">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Service Templates</h1>
          <p className="text-sm text-muted-foreground">Reusable building blocks for common services.</p>
        </div>
        <Button onClick={() => setEditing(empty())} className="bg-navy text-navy-foreground"><Plus />Add template</Button>
      </header>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card><CardContent className="p-0 divide-y">
          {list.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No templates yet.</div>}
          {list.map(t => (
            <div key={t.id} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted/50">
              <div className="min-w-0 flex-1">
                <div className="font-semibold doc-navy">{t.name}</div>
                <div className="text-xs text-muted-foreground">{SERVICE_TYPES.find(s => s.value === t.type)?.label} · {t.unitPrice}</div>
                {t.description && <div className="text-xs truncate">{t.description}</div>}
              </div>
              <Button size="icon" variant="ghost" onClick={() => setEditing({ ...t })}><Edit3 className="size-3.5" /></Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if (confirm("Delete?")) setList(p => p.filter(x => x.id !== t.id)); }}><Trash2 className="size-3.5" /></Button>
            </div>
          ))}
        </CardContent></Card>

        {editing && (
          <Card><CardContent className="pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{list.some(c => c.id === editing.id) ? "Edit" : "New"} template</div>
              <Button variant="ghost" size="icon" onClick={() => setEditing(null)}><X className="size-4" /></Button>
            </div>
            <F label="Template name"><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></F>
            <div className="grid grid-cols-2 gap-3">
              <F label="Service type">
                <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SERVICE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </F>
              <F label="Unit"><Input value={editing.unit} onChange={e => setEditing({ ...editing, unit: e.target.value })} /></F>
              <F label="Default unit price" className="col-span-2"><Input type="number" step="0.01" value={editing.unitPrice} onChange={e => setEditing({ ...editing, unitPrice: Number(e.target.value) })} /></F>
              <F label="Description" className="col-span-2"><Textarea rows={2} value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} /></F>
              <F label="Notes" className="col-span-2"><Textarea rows={2} value={editing.notes} onChange={e => setEditing({ ...editing, notes: e.target.value })} /></F>
            </div>
            <Button onClick={save} className="bg-navy text-navy-foreground"><Save />Save</Button>
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}
function F({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1 ${className}`}><Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>{children}</div>;
}
