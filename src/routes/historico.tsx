import { meta } from "@/lib/meta";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel, SearchBox, FilterSelect, EmptyState, Btn } from "@/components/ui-kit";
import { useOperations } from "@/lib/operation-context";
export const Route = createFileRoute("/historico")({
  head: () => meta("Histórico de atividades", "Conferência logística interna da filial POA."),
  component: Page,
});
function Page() {
  const { state } = useOperations();
  const [q, setQ] = useState(""),
    [user, setUser] = useState("");
  const rows = state.history.filter(
    (e) =>
      (!user || e.usuario === user) &&
      [e.descricao, e.ref, e.usuario].join(" ").toLowerCase().includes(q.toLowerCase()),
  );
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
      <div className="info-strip mb-5">
        Histórico de demonstração. As alterações realizadas nesta sessão preservam os valores
        anteriores; a auditoria durável e protegida será implementada no backend.
      </div>
      <div className="toolbar">
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder="Buscar NF, operação, pendência ou descrição"
        />
        <FilterSelect
          label="Usuário"
          value={user}
          onChange={setUser}
          options={[...new Set(state.history.map((e) => e.usuario))].map((v) => [v, v])}
        />
      </div>
      <Panel
        title="Linha do tempo"
        actions={<span className="muted">{rows.length} eventos</span>}
        flush
      >
        {rows.length ? (
          <ol className="timeline">
            {rows.map((e) => (
              <li key={e.id}>
                <time>{e.quando}</time>
                <div>
                  <h3>{e.descricao}</h3>
                  <p>
                    {e.usuario} · {e.ref} · {e.tipo}
                  </p>
                </div>
              </li>
            ))}
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
