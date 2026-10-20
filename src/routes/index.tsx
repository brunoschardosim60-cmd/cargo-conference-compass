import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Plus, PackageSearch } from "lucide-react";
import { Btn, SearchBox } from "@/components/ui-kit";
import { OperationTable } from "@/components/operation-table";
import { NewOperation } from "@/components/new-operation";
import { useOperations } from "@/lib/operation-context";
import { meta } from "@/lib/meta";
import { useHandheld } from "@/hooks/use-handheld";
import { FieldOperations } from "@/components/field-conference";

export const Route = createFileRoute("/")({
  head: () => meta("Recebimento", "Trabalho da equipe POA."),
  component: Dashboard,
});
function Dashboard() {
  const handheld = useHandheld();
  const { state } = useOperations();
  const [create, setCreate] = useState(false);
  const [filter, setFilter] = useState("andamento");
  const [query, setQuery] = useState("");
  if (handheld) return <FieldOperations />;
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const rows = state.operations.filter(
    (o) =>
      (filter === "todas" ||
        (filter === "hoje" ? o.chegada.startsWith(today) : o.status !== "concluida")) &&
      [
        o.id,
        o.placa,
        o.origem,
        ...state.notes
          .filter((n) => n.conferencia === o.id)
          .flatMap((n) => [n.nf, n.pedido, n.destinatario]),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const cases = state.cases
    .filter((c) => !["resolvida", "cancelada"].includes(c.status))
    .sort(
      (a, b) =>
        Number(!!b.discoveries?.some((d) => d.state === "pending")) -
        Number(!!a.discoveries?.some((d) => d.state === "pending")),
    );
  return (
    <div className="simple-desk">
      <header className="simple-desk-heading">
        <div>
          <span className="eyebrow">RECEBIMENTO · POA</span>
          <h1>Operação do dia</h1>
          <p>Acompanhe as cargas e resolva o que ficou pendente.</p>
        </div>
        <Btn onClick={() => setCreate(true)}>
          <Plus size={17} />
          Nova operação
        </Btn>
      </header>
      <div className="simple-desk-grid">
        <section className="simple-operations">
          <SearchBox placeholder="Buscar placa, NF ou cliente" value={query} onChange={setQuery} />
          <div className="segment-tabs" aria-label="Período das operações">
            {[
              ["andamento", "Em aberto"],
              ["hoje", "Chegadas de hoje"],
              ["todas", "Todas"],
            ].map(([value, label]) => (
              <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value!)}>
                {label}
              </button>
            ))}
          </div>
          <div className="panel">
            <OperationTable rows={rows} />
          </div>
          <p className="desk-note">
            {filter === "hoje"
              ? `Chegadas em ${today.split("-").reverse().join("/")} · datas não informadas ficam em Todas.`
              : "Cargas aguardando início, em conferência ou pausadas."}
          </p>
          <Link to="/conferencias" className="table-link">
            Consultar conferências <ArrowRight size={15} />
          </Link>
          <section className="recent-activity">
            <header>
              <h2>Histórico recente</h2>
              <Link to="/historico">Ver tudo</Link>
            </header>
            {state.history.slice(0, 3).map((event) => (
              <details key={event.id}>
                <summary>
                  <span>
                    {(
                      {
                        conferencia: "Contagem registrada",
                        localizacao_informada: "Volume localizado",
                        validacao_localizacao: "Localização verificada",
                        tratamento: "Pendência atualizada",
                        operacao: "Conferência atualizada",
                      } as Record<string, string>
                    )[event.tipo] || "Registro da operação"}{" "}
                    ·{" "}
                    {state.cases.find((c) => c.id === event.ref)?.nf ||
                      state.operations.find((o) => o.id === event.ref)?.placa ||
                      event.ref}
                  </span>
                  <time>{event.quando}</time>
                </summary>
                <p>{event.descricao}</p>
                <small>{event.usuario}</small>
              </details>
            ))}
          </section>
        </section>
        <aside className="simple-priorities">
          <header>
            <h2>Precisa de atenção</h2>
            <span>{cases.length}</span>
          </header>
          {cases.slice(0, 4).map((item) => (
            <Link to="/pendencias" key={item.id} className="priority-row">
              <span className="priority-label">
                {item.discoveries?.some((d) => d.state === "pending")
                  ? "Validar localização"
                  : item.tipo === "avaria"
                    ? "Verificar avaria"
                    : "Analisar divergência"}
              </span>
              <strong>NF {item.nf}</strong>
              <span>{item.cliente}</span>
              <small>{item.registradoEm}</small>
            </Link>
          ))}
          {!cases.length && <p className="desk-note">Nenhuma pendência em aberto.</p>}
          <Link to="/pendencias" className="priority-all">
            Todas as pendências <ArrowRight size={16} />
          </Link>
          <Link to="/extraviados" className="other-destinations">
            <PackageSearch size={23} />
            <span>
              <strong>Volumes de outras praças</strong>
              <small>Identificação e retorno</small>
            </span>
            <ArrowRight size={16} />
          </Link>
        </aside>
      </div>
      <NewOperation open={create} onOpenChange={setCreate} />
    </div>
  );
}
