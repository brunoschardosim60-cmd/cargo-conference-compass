import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Plus, FileUp } from "lucide-react";
import { Btn } from "@/components/ui-kit";
import { OperationTable } from "@/components/operation-table";
import { NewOperation } from "@/components/new-operation";
import { useOperations } from "@/lib/operation-context";
import { needsCount } from "@/lib/operation-model";
import { nfMap } from "@/components/status";
import { meta } from "@/lib/meta";
import { useHandheld } from "@/hooks/use-handheld";
import { FieldOperations } from "@/components/field-conference";

export const Route = createFileRoute("/")({
  head: () => meta("Recebimento", "Relações de carga e conferências da filial POA."),
  component: Dashboard,
});

function Dashboard() {
  const handheld = useHandheld();
  const { state } = useOperations();
  const [create, setCreate] = useState(false);
  const [pdf, setPdf] = useState(false);
  if (handheld) return <FieldOperations />;
  const active = state.operations.filter((o) => o.status === "em_andamento");
  const waiting = state.operations.filter((o) => ["aguardando", "pausada"].includes(o.status));
  const cases = state.cases.filter((c) => !["resolvida", "cancelada"].includes(c.status));
  const focus = active[0];
  const notes = state.notes.filter((n) => n.conferencia === focus?.id);
  const counted = notes.filter((n) => !needsCount(n)).length;
  return (
    <div className="receiving-desk">
      <header className="desk-heading">
        <div>
          <div className="document-kicker">
            <span /> FILIAL PORTO ALEGRE / RECEBIMENTO
          </div>
          <h1>
            Controle de cargas<span>.</span>
          </h1>
          <p>Relações, conferências e pendências do pavilhão.</p>
        </div>
        <div className="desk-heading-actions">
          <Btn variant="outline" onClick={() => setPdf(true)}>
            <FileUp size={16} />
            Relação PDF<span className="coming-label">Em preparação</span>
          </Btn>
          <Btn onClick={() => setCreate(true)}>
            <Plus size={16} />
            Nova operação
          </Btn>
        </div>
      </header>
      <nav className="desk-totals" aria-label="Resumo das operações">
        <Link to="/conferencias">
          <span className="signal-dot" />
          <strong>{active.length}</strong> em conferência
        </Link>
        <Link to="/conferencias">
          <strong>{waiting.length}</strong> aguardando / pausadas
        </Link>
        <Link to="/pendencias" className="total-attention">
          <strong>{cases.length}</strong> pendências abertas
          <ArrowRight size={14} />
        </Link>
        <span className="desk-total-caption">
          {state.operations.length} operações na base de teste
        </span>
      </nav>
      <div className="desk-columns">
        <div className="desk-main-column">
          {focus && (
            <section className="active-manifest" aria-label="Carga em conferência">
              <div className="manifest-dock">
                <small>DOCA</small>
                <strong>{focus.doca || "—"}</strong>
                <span>POA</span>
              </div>
              <div className="manifest-content">
                <div className="manifest-overline">
                  <span className="signal-dot" />
                  EM CONFERÊNCIA<span>{focus.id}</span>
                </div>
                <div className="manifest-route">
                  <h2>{focus.origem}</h2>
                  <ArrowRight size={20} />
                  <span>POA</span>
                </div>
                <div className="manifest-vehicle">
                  <strong>{focus.placa}</strong>
                  <span>{focus.responsavel}</span>
                </div>
                <div className="manifest-bottom">
                  <span>
                    <strong>{counted}</strong> / {notes.length} notas verificadas
                  </span>
                  <Link to="/conferencias/$id" params={{ id: focus.id }}>
                    Abrir relação
                    <ArrowRight size={16} />
                  </Link>
                </div>
                <progress
                  value={counted}
                  max={Math.max(notes.length, 1)}
                  aria-label="Progresso da carga em conferência"
                />
              </div>
            </section>
          )}
          <section className="desk-register">
            <header className="register-heading">
              <div>
                <span className="register-number">01</span>
                <h2>Relações de carga</h2>
              </div>
              <Link to="/conferencias">
                Todas as operações
                <ArrowRight size={14} />
              </Link>
            </header>
            <OperationTable rows={state.operations} />
            <footer className="register-footnote">
              Cada relação pertence a uma única operação de recebimento.
            </footer>
          </section>
          <section className="desk-register movement-register">
            <header className="register-heading">
              <div>
                <span className="register-number">02</span>
                <h2>Registro da operação</h2>
              </div>
              <Link to="/historico">
                Ver histórico
                <ArrowRight size={14} />
              </Link>
            </header>
            <ol>
              {state.history.slice(0, 3).map((event) => (
                <li key={event.id}>
                  <time>{event.quando}</time>
                  <div>
                    <p>{event.descricao}</p>
                    <span>
                      {event.usuario} · {event.ref}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <aside className="exception-register">
          <header>
            <span className="document-kicker">ADMINISTRATIVO</span>
            <div>
              <h2>A tratar</h2>
              <span>{cases.length.toString().padStart(2, "0")}</span>
            </div>
            <p>Pendências de recebimento</p>
          </header>
          {cases.slice(0, 4).map((item, index) => (
            <Link key={item.id} to="/pendencias" className="exception-line">
              <span className="exception-index">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <small>{nfMap[item.tipo][0]}</small>
                <strong>NF {item.nf}</strong>
                <p>{item.cliente}</p>
                <span>{item.responsavel || "Definir responsável"}</span>
              </div>
              <ArrowRight size={16} />
            </Link>
          ))}
          {!cases.length && <p className="exception-empty">Nenhuma pendência aberta.</p>}
          <Link to="/pendencias" className="exception-all">
            Abrir central de pendências
            <ArrowRight size={15} />
          </Link>
          <div className="internal-note">
            <strong>Registro interno</strong>
            <p>As referências oficiais são informadas após lançamento manual no sistema da Luft.</p>
          </div>
        </aside>
      </div>
      <NewOperation open={create} onOpenChange={setCreate} />
      <NewOperation open={pdf} onOpenChange={setPdf} initialMethod="pdf" />
    </div>
  );
}
