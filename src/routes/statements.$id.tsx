import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useStatements } from "@/lib/storage";
import { StatementEditor } from "@/components/doc/StatementEditor";

export const Route = createFileRoute("/statements/$id")({
  head: () => ({ meta: [{ title: "Statement — Elbakri Overseas" }] }),
  component: EditStatementPage,
});

function EditStatementPage() {
  const { id } = useParams({ from: "/statements/$id" });
  const [statements] = useStatements();
  const st = statements.find(s => s.id === id);
  if (!st) return <div className="p-8 text-center text-muted-foreground">Statement not found. <Link to="/documents" className="underline">Back</Link></div>;
  return <StatementEditor key={st.id} initial={st} />;
}
