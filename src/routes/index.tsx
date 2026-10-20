import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  ArrowRight,
  ClipboardCheck,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  PackageSearch,
  Radio,
} from "lucide-react";
import { PageHeader, Panel } from "@/components/ui-kit";
import { OperationTable } from "@/components/operation-table";
import { useOperations } from "@/lib/operation-context";
import { meta } from "@/lib/meta";
import { useHandheld } from "@/hooks/use-handheld";
import { FieldOperations } from "@/components/field-conference";
export const Route = createFileRoute("/")({
  head: () => meta("Visão geral", "Prioridades e operações da filial POA."),
  component: Dashboard,
});
function Dashboard() {
  const handheld = useHandheld();
  const { state } = useOperations();
  if (handheld) return <FieldOperations />;
  const metrics = [
    {
      label: "Em conferência",
      value: state.operations.filter((o) => o.status === "em_andamento").length,
      hint: "Operações no pavilhão",
      icon: ClipboardCheck,
      to: "/conferencias",
    },
    {
      label: "Aguardando / pausadas",
      value: state.operations.filter((o) => ["aguardando", "pausada"].includes(o.status)).length,
      hint: "Próximas operações da fila",
      icon: Clock3,
      to: "/conferencias",
    },
    {
      label: "Concluídas",
      value: state.operations.filter((o) => o.status === "concluida").length,
      hint: "Operações na amostra",
      icon: CheckCircle2,
      to: "/conferencias",
    },
    {
      label: "Pendências abertas",
      value: state.cases.filter((c) => !["resolvida", "cancelada"].includes(c.status)).length,
      hint: "Acompanhamento administrativo",
      icon: AlertTriangle,
      to: "/pendencias",
    },
  ] as const;
  return (
    <>
      <div className="eyebrow">CONTROLE OPERACIONAL / PORTO ALEGRE</div>
      <PageHeader
        title="O trabalho da operação, em um só lugar."
        subtitle="Acompanhe o recebimento, avance nas conferências e mantenha as pendências em movimento."
        actions={
          <Link to="/conferencias" className="table-link">
            Gerenciar operações <ArrowUpRight size={16} />
          </Link>
        }
      />
      <div className="metrics">
        {metrics.map((m) => (
          <Link to={m.to} className="metric" key={m.label}>
            <div className="metric-top">
              {m.label}
              <m.icon size={17} />
            </div>
            <div className="metric-value">{String(m.value).padStart(2, "0")}</div>
            <small>{m.hint}</small>
          </Link>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="space-y-5">
          <Panel
            title="Operações de recebimento"
            actions={
              <Link to="/conferencias" className="table-link">
                Ver todas <ArrowRight size={13} />
              </Link>
            }
            flush
          >
            <OperationTable rows={state.operations} />
            <div className="table-footer">
              <span>{state.operations.length} operações · base de demonstração</span>
              <span>Progresso por notas verificadas</span>
            </div>
          </Panel>
          <Panel
            title="Últimas movimentações"
            actions={
              <Link to="/historico" className="table-link">
                Histórico completo <ArrowRight size={13} />
              </Link>
            }
            flush
          >
            <div className="divide-y">
              {state.history.slice(0, 3).map((e) => (
                <div className="flex items-start gap-3 px-5 py-4" key={e.id}>
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-info" />
                  <div className="min-w-0">
                    <p className="text-xs leading-relaxed line-clamp-2">{e.descricao}</p>
                    <p className="cell-sub">
                      {e.usuario} · {e.quando} · {e.ref}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <Panel title="Exige atenção" flush>
          <div className="dashboard-priorities">
            <Link to="/pendencias" className="priority">
              <div className="priority-line">
                <AlertTriangle size={15} className="text-warning" />
                {state.cases.filter((c) => c.status === "nova").length} pendências sem análise
              </div>
              <p>Revise as divergências do pavilhão e defina a próxima providência.</p>
              <small>Abrir central administrativa →</small>
            </Link>
            <Link to="/conferencias" className="priority">
              <div className="priority-line">
                <Clock3 size={15} className="text-info" />
                Conferências para retomar
              </div>
              <p>
                {state.operations.filter((o) => o.status === "pausada").length} operação pausada. O
                progresso registrado permanece nesta sessão.
              </p>
              <small>Consultar fila de operações →</small>
            </Link>
            <Link to="/extraviados" className="priority">
              <div className="priority-line">
                <PackageSearch size={15} />
                Volumes de outras praças
              </div>
              <p>Controle separado para identificação e encaminhamento ao destino correto.</p>
              <small>Acompanhar encaminhamentos →</small>
            </Link>
          </div>
        </Panel>
      </div>
      <div className="info-strip mt-6">
        <Radio size={16} className="shrink-0 mt-0.5" />
        <span>
          <strong>Do pavilhão ao administrativo.</strong> O registro interno organiza o
          acompanhamento. Ocorrências oficiais continuam sendo lançadas manualmente nos sistemas da
          Luft.
        </span>
      </div>
    </>
  );
}
