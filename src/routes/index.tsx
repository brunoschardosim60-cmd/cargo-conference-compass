import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Upload } from "lucide-react";
import { Panel, DataTable, Mono } from "@/components/ui-kit";
import { StatusPill, confMap, ocMap, nfMap } from "@/components/status";
import { conferencias, ocorrencias } from "@/lib/demo-data";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/")({
  head: () => meta("Início", "Operações em andamento e pendências que precisam de ação na filial POA."),
  component: Dashboard,
});

function Dashboard() {
  const ativas = conferencias.filter((c) => c.status !== "concluida");
  const acao = ocorrencias.filter((o) => o.status !== "resolvida" && o.status !== "cancelada");
  const resumo = [
    ["Em conferência", conferencias.filter((c) => c.status === "em_andamento").length],
    ["Aguardando início", conferencias.filter((c) => c.status === "aguardando").length],
    ["Pendências abertas", acao.length],
    ["Concluídas hoje", conferencias.filter((c) => c.status === "concluida").length],
  ] as const;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Segunda, 19 de outubro</h1>
          <dl className="mt-1.5 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {resumo.map(([l, v]) => (
              <div key={l} className="flex gap-1.5"><dt className="text-muted-foreground">{l}</dt><dd className="font-semibold tabular">{v}</dd></div>
            ))}
          </dl>
        </div>
        <Link to="/conferencias" className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Upload className="size-4" />Importar relação PDF
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="Operações em andamento" flush actions={<Link to="/conferencias" className="text-xs font-medium text-info hover:underline">Todas as operações</Link>}>
          <DataTable head={["Placa / origem", "Doca", "Responsável", "Progresso", "Situação", ""]}>
            {ativas.map((c) => {
              const pct = Math.round((c.conferidos / c.volumes) * 100);
              return (
                <tr key={c.id}>
                  <td><Mono>{c.placa}</Mono><div className="text-xs text-muted-foreground">{c.origem} · {c.chegada}</div></td>
                  <td>{c.doca ?? <span className="text-muted-foreground">—</span>}</td>
                  <td>{c.responsavel}</td>
                  <td className="w-44">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
                      <span className="w-14 text-right text-xs tabular text-muted-foreground">{c.conferidos}/{c.volumes}</span>
                    </div>
                  </td>
                  <td><StatusPill map={confMap} value={c.status} /></td>
                  <td className="text-right"><Link to="/conferencias/$id" params={{ id: c.id }} aria-label={`Abrir ${c.id}`} className="inline-flex text-muted-foreground hover:text-foreground"><ArrowRight className="size-4" /></Link></td>
                </tr>
              );
            })}
          </DataTable>
        </Panel>

        <Panel title={`Precisa de ação · ${acao.length}`} flush actions={<Link to="/ocorrencias" className="text-xs font-medium text-info hover:underline">Ocorrências</Link>}>
          <ul className="divide-y">
            {acao.map((o) => (
              <li key={o.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{o.cliente}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{nfMap[o.tipo][0]}</span>
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">{o.proximaAcao}</div>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <Mono>NF {o.nf}</Mono><span>·</span><span>{o.responsavel ?? "Sem responsável"}</span>
                  <span className="ml-auto"><StatusPill map={ocMap} value={o.status} /></span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
