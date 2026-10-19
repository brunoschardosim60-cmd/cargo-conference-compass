import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { PageHeader, Panel, SearchBox, FilterSelect, Btn } from "@/components/ui-kit";
import { OperationTable } from "@/components/operation-table";
import { NewOperation } from "@/components/new-operation";
import { useOperations } from "@/lib/operation-context";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/conferencias/")({
  head: () => meta("Conferências", "Fila de operações de recebimento."),
  component: Page,
});
function Page() {
  const { state } = useOperations();
  const [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [owner, setOwner] = useState(""),
    [open, setOpen] = useState(false);
  const tabs = [
    ["", "Todas"],
    ["em_andamento", "Em andamento"],
    ["aguardando", "Aguardando início"],
    ["pausada", "Pausadas"],
    ["concluida", "Concluídas"],
  ] as const;
  const rows = state.operations.filter(
    (o) =>
      (!status || o.status === status) &&
      (!owner || o.responsavel === owner) &&
      [o.id, o.placa, o.motorista, o.origem].join(" ").toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <div className="eyebrow">PAVILHÃO / RECEBIMENTO</div>
      <PageHeader
        title="Conferências"
        subtitle="Uma operação por carreta. Relação, contagem e divergências sempre no mesmo contexto."
        actions={
          <Btn onClick={() => setOpen(true)}>
            <Plus size={15} />
            Nova operação
          </Btn>
        }
      />
      <div className="segment-tabs" aria-label="Filtrar operações por situação">
        {tabs.map(([v, l]) => (
          <button key={v} aria-pressed={status === v} onClick={() => setStatus(v)}>
            {l}
            <span>{state.operations.filter((o) => !v || o.status === v).length}</span>
          </button>
        ))}
      </div>
      <div className="toolbar">
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder="Buscar operação, placa, motorista ou origem"
        />
        <SlidersHorizontal size={15} className="text-muted-foreground" />
        <FilterSelect
          label="Responsável"
          value={owner}
          onChange={setOwner}
          options={[...new Set(state.operations.map((o) => o.responsavel))].map((v) => [v, v])}
        />
        {(q || owner || status) && (
          <Btn
            variant="ghost"
            onClick={() => {
              setQ("");
              setOwner("");
              setStatus("");
            }}
          >
            Limpar filtros
          </Btn>
        )}
      </div>
      <Panel flush>
        <OperationTable rows={rows} />
        <div className="table-footer">
          <span>
            {rows.length} de {state.operations.length} operações
          </span>
          <span>Dados de demonstração</span>
        </div>
      </Panel>
      <NewOperation open={open} onOpenChange={setOpen} />
    </>
  );
}
