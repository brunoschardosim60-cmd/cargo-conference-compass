import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Save, CheckCheck, Check } from "lucide-react";
import { Panel, SearchBox, FilterSelect, Btn, NotConnected, Mono, EmptyState } from "@/components/ui-kit";
import { StatusPill, confMap, nfMap } from "@/components/status";
import { conferencias, notas as allNotas, type NfStatus, type NotaFiscal } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/conferencias/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Conferência ${params.id} · Conferência POA` },
      { name: "description", content: `Conferência física das notas fiscais da operação ${params.id}.` },
      { property: "og:title", content: `Conferência ${params.id}` },
      { property: "og:description", content: "Registro de volumes, faltas, avarias e divergências por NF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

const options: NfStatus[] = ["conferida", "falta", "avaria", "excedente", "divergencia", "localizacao"];

function Page() {
  const { id } = Route.useParams();
  const conf = conferencias.find((c) => c.id === id) ?? conferencias[0]!;
  const [rows, setRows] = useState<NotaFiscal[]>(() => allNotas.filter((n) => n.conferencia === conf.id));
  const [q, setQ] = useState("");
  const [st, setSt] = useState("");
  const [sel, setSel] = useState<string | null>(rows.find((r) => r.status === "pendente")?.nf ?? rows[0]?.nf ?? null);
  const [saved, setSaved] = useState(false);

  const filtered = useMemo(() => rows.filter((n) => (!st || n.status === st) &&
    [n.nf, n.pedido, n.remetente, n.destinatario].join(" ").toLowerCase().includes(q.toLowerCase())), [rows, q, st]);
  const current = rows.find((r) => r.nf === sel);
  const done = rows.filter((r) => r.status !== "pendente").length;

  const update = (patch: Partial<NotaFiscal>) => {
    setSaved(false);
    setRows((rs) => rs.map((r) => (r.nf === sel ? { ...r, ...patch, registradoPor: "Ana P.", registradoEm: "agora" } : r)));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <Link to="/conferencias" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Conferências</Link>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-md border bg-card p-4">
        <div>
          <div className="flex items-center gap-3"><h1 className="font-mono text-lg font-semibold">{conf.id}</h1><StatusPill map={confMap} value={conf.status} /></div>
          <p className="mt-1 text-sm text-muted-foreground">
            {conf.origem} · placa <Mono>{conf.placa}</Mono> · {conf.motorista} · doca {conf.doca ?? "—"} · chegada {conf.chegada}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right"><div className="text-xs text-muted-foreground">NFs registradas</div><div className="text-lg font-semibold tabular">{done} / {rows.length}</div></div>
          <Btn variant="outline" onClick={() => setSaved(true)}><Save className="size-4" />{saved ? "Salvo (demo)" : "Salvar parcial"}</Btn>
          <Btn disabled={done < rows.length}><CheckCheck className="size-4" />Concluir</Btn>
        </div>
      </div>

      <NotConnected>As alterações nesta tela ficam só nesta sessão de demonstração e não são gravadas.</NotConnected>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <SearchBox placeholder="NF, pedido, cliente ou destinatário" value={q} onChange={setQ} />
            <FilterSelect label="Situação" value={st} onChange={setSt} options={Object.entries(nfMap).map(([k, v]) => [k, v[0]])} />
          </div>
          <Panel flush>
            {filtered.length === 0 ? <EmptyState title="Nenhuma NF encontrada" text="Verifique o número digitado ou limpe os filtros." /> : (
              <ul className="divide-y">
                {filtered.map((n) => (
                  <li key={n.nf}>
                    <button onClick={() => setSel(n.nf)} className={cn("grid w-full grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-left hover:bg-muted/40", sel === n.nf && "bg-accent")}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2"><Mono>NF {n.nf}</Mono><span className="text-xs text-muted-foreground">{n.pallet} · {n.praca}</span></div>
                        <div className="truncate text-sm text-muted-foreground">{n.destinatario}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm tabular"><span className="font-semibold">{n.encontrados ?? "—"}</span><span className="text-muted-foreground"> / {n.previstos} vol</span></span>
                        <StatusPill map={nfMap} value={n.status} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {current && (
          <Panel title={`NF ${current.nf}`} className="h-fit lg:sticky lg:top-20">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Pedido</dt><dd><Mono>{current.pedido}</Mono></dd>
              <dt className="text-muted-foreground">Remetente</dt><dd>{current.remetente}</dd>
              <dt className="text-muted-foreground">Destinatário</dt><dd>{current.destinatario}</dd>
              <dt className="text-muted-foreground">Praça</dt><dd>{current.praca}</dd>
              <dt className="text-muted-foreground">Peso</dt><dd className="tabular">{current.peso.toFixed(1)} kg</dd>
            </dl>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <Num label="Previstos" value={current.previstos} />
              <label className="rounded-md border p-2.5">
                <span className="block text-xs text-muted-foreground">Encontrados</span>
                <input type="number" min={0} value={current.encontrados ?? ""} onChange={(e) => update({ encontrados: e.target.value === "" ? null : Number(e.target.value) })}
                  className="w-full bg-transparent text-xl font-semibold tabular outline-none" placeholder="—" />
              </label>
              <Num label="Diferença" value={current.encontrados == null ? "—" : current.encontrados - current.previstos}
                tone={current.encontrados == null ? "" : current.encontrados < current.previstos ? "text-danger" : current.encontrados > current.previstos ? "text-warning" : "text-success"} />
            </div>

            <div className="mt-5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Registrar situação</span>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {options.map((o) => (
                  <button key={o} onClick={() => update({ status: o })}
                    className={cn("flex items-center gap-1.5 rounded-md border px-2.5 py-2 text-left text-xs font-medium hover:bg-muted", current.status === o && "border-primary bg-accent")}>
                    {current.status === o && <Check className="size-3.5" />}{nfMap[o][0]}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">NF não encontrada fica como “pendente de localização” — não é tratada automaticamente como extravio ou falta definitiva.</p>
            </div>
            {current.registradoPor && (
              <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">Último registro: {current.registradoPor} · {current.registradoEm}</p>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}

function Num({ label, value, tone = "" }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="rounded-md border bg-muted/40 p-2.5">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-xl font-semibold tabular", tone)}>{typeof value === "number" && value > 0 && label === "Diferença" ? `+${value}` : value}</span>
    </div>
  );
}
