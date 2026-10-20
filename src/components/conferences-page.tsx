import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, SlidersHorizontal } from "lucide-react";
import { useOperations } from "@/lib/operation-context";
import { operationMatches, openIssues, arrivalDay } from "@/lib/operation-search";
import { Btn, FilterSelect, Panel, PageHeader, SearchBox } from "./ui-kit";
import { OperationTable } from "./operation-table";
import { NewOperation } from "./new-operation";

export function ConferencesPage() {
  const { state } = useOperations();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("abertas");
  const [owner, setOwner] = useState("");
  const [date, setDate] = useState("");
  const [issues, setIssues] = useState(false);
  const [open, setOpen] = useState(false);
  const rows = state.operations.filter(
    (o) =>
      (scope === "todas" ||
        (scope === "concluidas" ? o.status === "concluida" : o.status !== "concluida")) &&
      (!owner || o.responsavel === owner) &&
      (!date || arrivalDay(o) === date) &&
      (!issues || openIssues(state, o.id) > 0) &&
      operationMatches(state, o, query),
  );
  const filtered = !!(owner || date || issues);
  return (
    <div className="conference-home">
      <PageHeader
        title="Conferências"
        subtitle="Encontre a carreta e acompanhe a contagem."
        actions={
          <Btn onClick={() => setOpen(true)}>
            <Plus size={18} />
            Nova operação
          </Btn>
        }
      />
      <div className="conference-search">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Buscar NF, placa, motorista, operação ou origem"
        />
        <details className="compact-filters">
          <summary>
            <SlidersHorizontal size={17} />
            Filtros{filtered ? " ativos" : ""}
          </summary>
          <div className="filter-fields">
            <FilterSelect
              label="Responsável"
              value={owner}
              onChange={setOwner}
              options={[...new Set(state.operations.map((o) => o.responsavel))].map((name) => [
                name,
                name,
              ])}
            />
            <label className="field-group">
              <span>Data de chegada</span>
              <input
                className="field"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label className="check-filter">
              <input
                type="checkbox"
                checked={issues}
                onChange={(e) => setIssues(e.target.checked)}
              />
              Com pendências em aberto
            </label>
            <Btn
              variant="ghost"
              onClick={() => {
                setOwner("");
                setDate("");
                setIssues(false);
              }}
            >
              Limpar filtros
            </Btn>
          </div>
        </details>
      </div>
      <div className="segment-tabs" aria-label="Situação das conferências">
        {[
          ["abertas", "Para acompanhar"],
          ["concluidas", "Concluídas"],
          ["todas", "Todas"],
        ].map(([value, label]) => (
          <button key={value} aria-pressed={scope === value} onClick={() => setScope(value!)}>
            {label}
          </button>
        ))}
      </div>
      {filtered && (
        <p className="active-filter-note">
          Filtros aplicados{owner ? ` · ${owner}` : ""}
          {date ? ` · ${date}` : ""}
          {issues ? " · com pendências" : ""}
        </p>
      )}
      <Panel flush>
        <OperationTable rows={rows} />
      </Panel>
      <div className="conference-footer">
        <span>{rows.length} operações nesta consulta</span>
        <Link to="/notas">Pesquisar todas as notas</Link>
      </div>
      <NewOperation open={open} onOpenChange={setOpen} />
    </div>
  );
}
