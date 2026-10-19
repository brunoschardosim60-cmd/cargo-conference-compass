import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { PageHeader, Panel, DataTable, SearchBox, FilterSelect, NotConnected, Mono, EmptyState } from "@/components/ui-kit";
import { StatusPill, ocMap, nfMap } from "@/components/status";
import { ocorrencias, conferencias } from "@/lib/demo-data";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/pendencias")({
  head: () => meta("Pendências e faltas", "Central administrativa de tratamento de divergências e faltas."),
  component: Page,
});

const pessoas = ["Ana P.", "Bruno T.", "Torre"];

function Page() {
  const [q, setQ] = useState("");
  const [f, setF] = useState({ conf: "", tipo: "", status: "", resp: "", conferente: "" });
  const [rows, setRows] = useState(ocorrencias);
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  const list = rows.filter((o) =>
    (!f.conf || o.conferencia === f.conf) && (!f.tipo || o.tipo === f.tipo) && (!f.status || o.status === f.status) &&
    (!f.resp || o.responsavel === f.resp) && (!f.conferente || o.registradoPor === f.conferente) &&
    [o.nf, o.cliente, o.id].join(" ").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader title="Pendências e faltas" subtitle="Divergências vindas do pavilhão aguardando tratamento administrativo." />
      <NotConnected>Atribuições e comentários não são gravados nesta versão. Nenhuma ocorrência oficial é registrada automaticamente.</NotConnected>
      <div className="flex flex-wrap gap-2">
        <SearchBox placeholder="NF, cliente ou nº da pendência" value={q} onChange={setQ} />
        <input type="date" aria-label="Data" className="h-9 rounded-md border border-input bg-card px-2.5 text-sm" />
        <FilterSelect label="Carreta" value={f.conf} onChange={set("conf")} options={conferencias.map((c) => [c.id, `${c.id} · ${c.placa}`])} />
        <FilterSelect label="Conferente" value={f.conferente} onChange={set("conferente")} options={["Marcos A.", "Carla M.", "Diego F."].map((p) => [p, p])} />
        <FilterSelect label="Tipo" value={f.tipo} onChange={set("tipo")} options={Object.entries(nfMap).filter(([k]) => k !== "pendente" && k !== "conferida").map(([k, v]) => [k, v[0]])} />
        <FilterSelect label="Responsável" value={f.resp} onChange={set("resp")} options={pessoas.map((p) => [p, p])} />
        <FilterSelect label="Status" value={f.status} onChange={set("status")} options={Object.entries(ocMap).map(([k, v]) => [k, v[0]])} />
      </div>
      <Panel flush>
        {list.length === 0 ? <EmptyState title="Nenhuma pendência" text="Nenhum item corresponde aos filtros selecionados." /> : (
          <DataTable head={["Pendência", "NF / Cliente", "Tipo", "Origem", "Registrado por", "Responsável", "Próxima ação", "Status", ""]}>
            {list.map((o) => (
              <tr key={o.id}>
                <td><Mono>{o.id}</Mono></td>
                <td><Mono>{o.nf}</Mono><div className="text-xs text-muted-foreground">{o.cliente}</div></td>
                <td><StatusPill map={nfMap} value={o.tipo} /></td>
                <td><Mono>{o.conferencia}</Mono></td>
                <td>{o.registradoPor}<div className="text-xs text-muted-foreground tabular">{o.registradoEm}</div></td>
                <td>
                  <select value={o.responsavel ?? ""} onChange={(e) => setRows((rs) => rs.map((r) => r.id === o.id ? { ...r, responsavel: e.target.value } : r))}
                    className="h-8 rounded-sm border border-input bg-card px-2 text-sm">
                    <option value="">Atribuir…</option>
                    {pessoas.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </td>
                <td className="max-w-56 text-muted-foreground">{o.proximaAcao}</td>
                <td><StatusPill map={ocMap} value={o.status} /></td>
                <td><span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MessageSquare className="size-3.5" />{o.comentarios}</span></td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}
