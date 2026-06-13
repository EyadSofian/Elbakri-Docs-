import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStatements } from "@/lib/storage";
import { buildBlankStatement } from "@/components/doc/StatementEditor";

export const Route = createFileRoute("/statements/new")({
  head: () => ({ meta: [{ title: "New Statement — Elbakri Overseas" }] }),
  component: NewStatement,
});

function NewStatement() {
  const [, setStatements] = useStatements();
  const nav = useNavigate();
  useEffect(() => {
    const s = buildBlankStatement();
    setStatements(prev => [s, ...prev]);
    nav({ to: "/statements/$id", params: { id: s.id }, replace: true });
  }, []);
  return <div className="p-6 text-sm text-muted-foreground">Creating statement…</div>;
}
