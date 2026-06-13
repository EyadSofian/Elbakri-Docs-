import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit3, Save, X } from "lucide-react";
import { useClients, emptyClient, type Client, uid } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/clients")({
  head: () => ({ meta: [{ title: "Clients & Agencies — Elbakri Overseas" }] }),
  component: ClientsPage,
});

function ClientsPage() {
  const [clients, setClients] = useClients();
  const [editing, setEditing] = useState<Client | null>(null);
  const [q, setQ] = useState("");
  const filtered = clients.filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.email.toLowerCase().includes(q.toLowerCase()),
  );

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) return toast.error("Name required");
    setClients((prev) => {
      const ix = prev.findIndex((c) => c.id === editing.id);
      if (ix === -1) return [editing, ...prev];
      const n = [...prev];
      n[ix] = editing;
      return n;
    });
    setEditing(null);
    toast.success("Saved");
  };

  return (
    <div className="p-6 space-y-4 max-w-6xl mx-auto">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clients & Agencies</h1>
          <p className="text-sm text-muted-foreground">{clients.length} stored in database.</p>
        </div>
        <Button onClick={() => setEditing(emptyClient())} className="bg-navy text-navy-foreground">
          <Plus />
          Add client
        </Button>
      </header>

      <Input
        placeholder="Search clients…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-md"
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-0 divide-y">
            {filtered.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">No clients.</div>
            )}
            {filtered.map((c) => (
              <div
                key={c.id}
                className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold doc-navy">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {c.email} · {c.phone}
                  </div>
                  {c.address && (
                    <div className="text-xs text-muted-foreground truncate">{c.address}</div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditing({ ...c })}>
                    <Edit3 className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm("Delete?")) setClients((p) => p.filter((x) => x.id !== c.id));
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {editing && (
          <Card>
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">
                  {clients.some((c) => c.id === editing.id) ? "Edit" : "New"} client
                </div>
                <Button variant="ghost" size="icon" onClick={() => setEditing(null)}>
                  <X className="size-4" />
                </Button>
              </div>
              <F label="Name">
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </F>
              <div className="grid grid-cols-2 gap-3">
                <F label="Email">
                  <Input
                    value={editing.email}
                    onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                  />
                </F>
                <F label="Phone">
                  <Input
                    value={editing.phone}
                    onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                  />
                </F>
                <F label="Tax ID" className="col-span-2">
                  <Input
                    value={editing.taxId}
                    onChange={(e) => setEditing({ ...editing, taxId: e.target.value })}
                  />
                </F>
                <F label="Address" className="col-span-2">
                  <Textarea
                    rows={2}
                    value={editing.address}
                    onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                  />
                </F>
                <F label="Notes" className="col-span-2">
                  <Textarea
                    rows={2}
                    value={editing.notes}
                    onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  />
                </F>
              </div>
              <Button onClick={save} className="bg-navy text-navy-foreground">
                <Save />
                Save
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
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
