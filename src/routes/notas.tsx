import { meta } from "@/lib/meta";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import {
  PageHeader,
  Panel,
  DataTable,
  SearchBox,
  FilterSelect,
  EmptyState,
  Btn,
} from "@/components/ui-kit";
import { StatusPill, nfMap } from "@/components/status";
import { useOperations } from "@/lib/operation-context";
export const Route = createFileRoute("/notas")({
  head: () => meta("Notas fiscais", "Conferência logística interna da filial POA."),
  component: Page,
});
function Page() {
  const { state } = useOperations();
  const [q, setQ] = useState(""),
    [operation, setOperation] = useState(""),
    [status, setStatus] = useState("");
  const rows = state.notes.filter(
    (n) =>
      (!operation || n.conferencia === operation) &&
      (!status || n.status === status) &&
      [n.nf, n.pedido, n.destinatario, n.praca, n.pallet]
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  return (
    <>
      <div className="eyebrow">CONSULTA / RELAÇÕES DE CARGA</div>
      <PageHeader
        title="Notas fiscais"
        subtitle="Localize a mercadoria e consulte seu resultado dentro da operação correta."
      />
      <div className="toolbar">
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder="NF, pedido, destinatário, praça ou pallet"
        />
        <FilterSelect
          label="Operação"
          value={operation}
          onChange={setOperation}
          options={state.operations.map((o) => [o.id, o.id])}
        />
        <FilterSelect
          label="Situação"
          value={status}
          onChange={setStatus}
          options={Object.entries(nfMap).map(([k, v]) => [k, v[0]])}
        />
        {(q || operation || status) && (
          <Btn
            variant="ghost"
            onClick={() => {
              setQ("");
              setOperation("");
              setStatus("");
            }}
          >
            Limpar
          </Btn>
        )}
      </div>
      <Panel flush>
        {rows.length ? (
          <DataTable
            head={[
              "NF / pedido",
              "Destinatário / praça",
              "Operação",
              "Pallet",
              "Previstos",
              "Encontrados",
              "Situação",
              "Ação",
            ]}
          >
            {rows.map((n) => (
              <tr key={n.id}>
                <td>
                  <span className="cell-primary">{n.nf}</span>
                  <div className="cell-sub">{n.pedido || "Sem pedido"}</div>
                </td>
                <td>
                  {n.destinatario}
                  <div className="cell-sub">{n.praca || "Não informada"}</div>
                </td>
                <td className="text-xs">{n.conferencia}</td>
                <td>{n.pallet || "—"}</td>
                <td>{n.previstos}</td>
                <td>{n.encontrados ?? "—"}</td>
                <td>
                  <StatusPill map={nfMap} value={n.status} />
                </td>
                <td>
                  <Link
                    to="/conferencias/$id"
                    params={{ id: n.conferencia }}
                    search={{ nota: n.id }}
                    className="table-link"
                    aria-label={"Abrir operação da NF " + n.nf}
                  >
                    Abrir
                    <ArrowUpRight size={13} />
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <EmptyState
            title="Nenhuma nota encontrada"
            text="Confira a busca ou remova os filtros."
          />
        )}
        <div className="table-footer">
          <span>
            {rows.length} notas · {new Set(rows.map((n) => n.conferencia)).size} operações
          </span>
          <span>A identidade da nota inclui a operação de origem.</span>
        </div>
      </Panel>
    </>
  );
}
