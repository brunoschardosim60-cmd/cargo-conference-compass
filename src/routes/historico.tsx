import { meta } from "@/lib/meta";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel, SearchBox, FilterSelect, EmptyState, Btn } from "@/components/ui-kit";
import { historyContext, historyMatches } from "@/lib/history-search";
import { EvidencePhotos } from "@/components/evidence-photos";
import { useOperations } from "@/lib/operation-context";
export const Route = createFileRoute("/historico")({
  head: () => meta("Histórico de atividades", "Conferência logística interna da filial POA."),
  component: Page,
});
function Page() {
  const { state } = useOperations();
  const [q, setQ] = useState(""),
    [user, setUser] = useState(""),
    [date, setDate] = useState("");
  const rows = state.history.filter((e) => historyMatches(state, e, q, date, user));
  return (
    <>
      <div className="eyebrow">RASTREABILIDADE / ATIVIDADES</div>
      <PageHeader
        title="Histórico de atividades"
        subtitle="Consulte quem registrou, o que mudou e a operação relacionada."
        actions={
          <Btn
            variant="outline"
            onClick={() => {
              const blob = new Blob(
                [
                  JSON.stringify(
                    {
                      ambiente: "DEMONSTRAÇÃO — dados de teste, sem autenticação real",
                      exportadoEm: new Date().toISOString(),
                      ...state,
                    },
                    null,
                    2,
                  ),
                ],
                { type: "application/json" },
              );
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `poa-registros-teste-${new Date().toISOString().slice(0, 10)}.json`;
              link.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            Baixar registros de teste
          </Btn>
        }
      />
      <div className="toolbar">
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder="Buscar NF, cliente, destino ou identificação"
        />
        <details className="compact-filters">
          <summary>Filtros{user || date ? " ativos" : ""}</summary>
          <div className="filter-fields">
            <FilterSelect
              label="Usuário"
              value={user}
              onChange={setUser}
              options={[...new Set(state.history.map((e) => e.usuario))].map((v) => [v, v])}
            />
            <label className="field-group">
              <span>Data da movimentação</span>
              <input
                className="field"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <Btn
              variant="ghost"
              onClick={() => {
                setUser("");
                setDate("");
              }}
            >
              Limpar filtros
            </Btn>
          </div>
        </details>
      </div>
      <Panel
        title="Linha do tempo"
        actions={<span className="muted">{rows.length} eventos</span>}
        flush
      >
        {rows.length ? (
          <ol className="timeline">
            {rows.map((e) => {
              const context = historyContext(state, e);
              return (
                <li key={e.id}>
                  <time>{e.quando}</time>
                  <div>
                    <details className="history-event">
                      <summary>
                        <strong>{context.title}</strong>
                        <span>
                          {e.usuario} · {e.tipo.replaceAll("_", " ")}
                        </span>
                      </summary>
                      <p className="history-description">{e.descricao}</p>
                      <EvidencePhotos photos={e.photos || []} />
                      {context.other ? (
                        <Link
                          className="table-link"
                          to="/extraviados"
                          search={{ registro: context.other.id }}
                        >
                          Abrir volume e linha do tempo
                        </Link>
                      ) : context.item ? (
                        <Link
                          className="table-link"
                          to="/pendencias"
                          search={{ caso: context.item.id }}
                        >
                          Abrir pendência e histórico
                        </Link>
                      ) : context.operation ? (
                        <Link
                          className="table-link"
                          to="/conferencias/$id"
                          params={{ id: context.operation.id }}
                          search={context.note ? { nota: context.note.id } : {}}
                        >
                          Abrir conferência
                        </Link>
                      ) : null}
                    </details>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState
            title="Nenhum evento encontrado"
            text="Altere os filtros para consultar outras atividades."
          />
        )}
      </Panel>
    </>
  );
}
