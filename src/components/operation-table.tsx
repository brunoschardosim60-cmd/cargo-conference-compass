import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { DataTable, EmptyState } from "./ui-kit";
import { StatusPill, confMap } from "./status";
import { useOperations } from "@/lib/operation-context";
import type { Operation } from "@/lib/operation-model";
import { openIssues } from "@/lib/operation-search";
export function OperationTable({ rows }: { rows: Operation[] }) {
  const { state } = useOperations();
  if (!rows.length)
    return (
      <EmptyState
        title="Nenhuma operação encontrada"
        text="Altere a busca ou remova os filtros para consultar outras operações."
      />
    );
  return (
    <DataTable head={["Carreta / origem", "Doca / chegada", "Conferência", "Situação", "Ação"]}>
      {rows.map((c) => {
        const notes = state.notes.filter((n) => n.conferencia === c.id),
          done = notes.filter((n) => n.status !== "pendente" && n.encontrados !== null).length;
        const percent = notes.length ? Math.round((done / notes.length) * 100) : 0;
        return (
          <tr key={c.id}>
            <td>
              <Link to="/conferencias/$id" params={{ id: c.id }} className="cell-primary">
                {c.placa}
              </Link>
              <div className="cell-sub">{c.origem} → POA</div>
            </td>
            <td>
              <span className="font-mono text-xs">{c.doca || "Sem doca"}</span>
              <div className="cell-sub">{c.chegada}</div>
            </td>
            <td>
              <div className="progress-cell">
                <div className="progress-track">
                  <span style={{ width: percent + "%" }} />
                </div>
                <span>
                  {done}/{notes.length} NFs
                </span>
              </div>
              <div className="cell-sub">
                {c.responsavel === "—" ? "Aguardando responsável" : c.responsavel}
              </div>
            </td>
            <td>
              <StatusPill map={confMap} value={c.status} />
              {openIssues(state, c.id) > 0 && (
                <Link to="/pendencias" search={{ operacao: c.id }} className="operation-issue">
                  {openIssues(state, c.id)} pendência(s)
                </Link>
              )}
            </td>
            <td>
              <Link to="/conferencias/$id" params={{ id: c.id }} className="table-link">
                {c.status === "concluida"
                  ? "Consultar"
                  : c.status === "aguardando"
                    ? "Abrir"
                    : "Continuar"}
                <ArrowRight size={14} />
              </Link>
            </td>
          </tr>
        );
      })}
    </DataTable>
  );
}
