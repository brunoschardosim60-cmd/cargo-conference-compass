import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ClipboardCheck, AlertTriangle, PackageX, FileWarning, PackageSearch, Siren, CheckCircle2, FileCheck2 } from "lucide-react";
import { PageHeader, Panel, DataTable, NotConnected, Mono } from "@/components/ui-kit";
import { StatusPill, confMap } from "@/components/status";
import { conferencias, eventos } from "@/lib/demo-data";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/")({
  head: () => meta("Visão geral", "Painel operacional da filial: conferências, faltas, divergências e ocorrências."),
  component: Dashboard,
});

const kpis = [
  { label: "Conferências em andamento", value: 2, icon: ClipboardCheck, tone: "text-info" },
  { label: "Conferências concluídas (hoje)", value: 2, icon: CheckCircle2, tone: "text-success" },
  { label: "NFs conferidas", value: 186, icon: FileCheck2, tone: "text-success" },
  { label: "Faltas de volumes em aberto", value: 3, icon: PackageX, tone: "text-danger" },
  { label: "NFs com divergência", value: 5, icon: FileWarning, tone: "text-warning" },
  { label: "Excedentes / não identificados", value: 2, icon: AlertTriangle, tone: "text-warning" },
  { label: "Extraviados aguardando retorno", value: 3, icon: PackageSearch, tone: "text-warning" },
  { label: "Ocorrências p/ administrativo", value: 4, icon: Siren, tone: "text-danger" },
];

function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Visão geral" subtitle="Filial Porto Alegre · segunda-feira, 19 de outubro" />
      <NotConnected>
        <strong>Modo demonstração.</strong> Todos os números e registros abaixo são fictícios. Banco de dados, login individual e permissões no servidor ainda não estão conectados.
      </NotConnected>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border md:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{k.label}</span>
              <k.icon className={`size-4 ${k.tone}`} />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Conferências recentes" flush className="lg:col-span-2"
          actions={<Link to="/conferencias" className="text-xs font-medium text-info hover:underline">Ver todas</Link>}>
          <DataTable head={["Operação", "Chegada", "Responsável", "NFs", "Situação", ""]}>
            {conferencias.map((c) => (
              <tr key={c.id}>
                <td><Mono>{c.id}</Mono><div className="text-xs text-muted-foreground">{c.origem}</div></td>
                <td className="tabular">{c.chegada}</td>
                <td>{c.responsavel}</td>
                <td className="tabular">{c.notas}</td>
                <td><StatusPill map={confMap} value={c.status} /></td>
                <td className="text-right">
                  <Link to="/conferencias/$id" params={{ id: c.id }} className="inline-flex items-center text-muted-foreground hover:text-foreground" aria-label="Detalhes">
                    <ArrowRight className="size-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        </Panel>

        <Panel title="Atividades recentes">
          <ol className="space-y-4">
            {eventos.slice(0, 7).map((e) => (
              <li key={e.id} className="flex gap-3 text-sm">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <div>
                  <p>{e.descricao}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{e.usuario} · {e.quando}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  );
}
