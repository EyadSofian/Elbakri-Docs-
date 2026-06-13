import { useParams, Link } from "react-router-dom";
import { useStatements } from "@/lib/storage";
import { StatementEditor } from "@/components/doc/StatementEditor";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function EditStatementPage() {
  useDocumentTitle("Statement — Elbakri Overseas");
  const { id } = useParams();
  const [statements] = useStatements();
  const st = statements.find((s) => s.id === id);
  if (!st)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Statement not found.{" "}
        <Link to="/documents" className="underline">
          Back
        </Link>
      </div>
    );
  return <StatementEditor key={st.id} initial={st} />;
}
