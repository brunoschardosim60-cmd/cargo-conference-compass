import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, CircleAlert, CircleCheck, Minus, Plus, ChevronDown } from "lucide-react";
import { CampoFrame, CampoTop, DemoTag } from "@/components/campo-ui";
import { conferencias, type NfStatus } from "@/lib/demo-data";
import { saveNota, useNotas, type NotaCampo } from "@/lib/campo-store";
import { nfMap } from "@/components/status";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/campo/$id/$cliente")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.cliente} · Conferência POA` },
      { name: "description", content: "Conferência de notas fiscais e volumes do cliente." },
      { property: "og:title", content: `Conferir ${params.cliente}` },
      { property: "og:description", content: "Registro de volumes encontrados e divergências por NF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

const tipos: NfStatus[] = ["localizacao", "falta", "avaria", "excedente", "divergencia"];
type Draft = { encontrados: string; tipo: NfStatus | null; obs: string };

function Page() {
  const { id, cliente } = Route.useParams();
  const nav = useNavigate();
  const conf = conferencias.find((c) => c.id === id) ?? conferencias[0]!;
  const notas = useNotas().filter((n) => n.conferencia === conf.id && n.destinatario === cliente);
  const [open, setOpen] = useState<string | null>(notas.find((n) => n.status === "pendente")?.nf ?? null);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!dirty.size) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const setDirtyFor = (nf: string, v: boolean) => setDirty((s) => { const n = new Set(s); v ? n.add(nf) : n.delete(nf); return n; });
  const back = () => {
    if (dirty.size && !window.confirm("Há uma conferência não salva. Sair e descartar?")) return;
    nav({ to: "/campo/$id", params: { id: conf.id } });
  };
  const onSaved = (nf: string, msg: string) => {
    setDirtyFor(nf, false);
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
    const next = notas.find((n) => n.nf !== nf && n.status === "pendente");
    setOpen(next?.nf ?? null);
  };

  const feitas = notas.filter((n) => n.status !== "pendente").length;

  return (
    <CampoFrame>
      <CampoTop back={`/campo/${conf.id}`} onBack={back} title={cliente} sub={<><span className="font-mono">{conf.placa}</span> · {feitas}/{notas.length} notas</>} right={<DemoTag />} />
      <ul className="divide-y">
        {notas.map((n) => (
          <NotaRow key={n.nf} n={n} open={open === n.nf}
            onToggle={() => setOpen(open === n.nf ? null : n.nf)}
            onDirty={(v) => setDirtyFor(n.nf, v)} onSaved={(m) => onSaved(n.nf, m)} />
        ))}
      </ul>
      {notas.length === 0 && <p className="px-6 py-12 text-center text-sm text-muted-foreground">Nenhuma nota para este cliente nesta carga.</p>}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
        {toast && <div className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm text-background shadow-md"><Check className="size-4" />{toast}</div>}
      </div>
    </CampoFrame>
  );
}

function NotaRow({ n, open, onToggle, onDirty, onSaved }: { n: NotaCampo; open: boolean; onToggle: () => void; onDirty: (v: boolean) => void; onSaved: (msg: string) => void }) {
  const initial: Draft = { encontrados: n.encontrados == null ? "" : String(n.encontrados), tipo: n.status !== "pendente" && n.status !== "conferida" ? n.status : null, obs: n.obs ?? "" };
  const [d, setD] = useState<Draft>(initial);
  const [divOpen, setDivOpen] = useState(initial.tipo !== null);
  const enc = d.encontrados === "" ? null : Number(d.encontrados);
  const diff = enc == null ? null : enc - n.previstos;
  const showDiv = divOpen || (diff !== null && diff !== 0);

  const upd = (p: Partial<Draft>) => { setD((x) => ({ ...x, ...p })); onDirty(true); };
  const step = (k: number) => upd({ encontrados: String(Math.max(0, (enc ?? n.previstos) + k)) });

  const confirmarOk = () => {
    const h = saveNota(n.nf, { encontrados: enc ?? n.previstos, status: "conferida", obs: undefined });
    onSaved(`NF ${n.nf} conferida · ${h}`);
  };
  const registrar = () => {
    if (!d.tipo) return;
    const h = saveNota(n.nf, { encontrados: enc, status: d.tipo, obs: d.obs || undefined });
    onSaved(`Pendência registrada na NF ${n.nf} · ${h}`);
  };

  const done = n.status === "conferida";
  const pend = n.status !== "pendente" && !done;

  return (
    <li className={cn(open && "bg-background")}>
      <button onClick={onToggle} aria-expanded={open} className={cn("grid w-full grid-cols-[4px_minmax(0,1fr)_auto_auto] items-center gap-3 py-3 pr-4 text-left", !open && "active:bg-muted")}>
        <span className={cn("h-9 rounded-r-sm", done ? "bg-success" : pend ? "bg-warning" : "bg-transparent")} />
        <div className="min-w-0">
          <div className="font-mono text-[15px] font-semibold">NF {n.nf}</div>
          <div className="truncate text-xs text-muted-foreground">Pedido {n.pedido} · {n.pallet}</div>
        </div>
        <div className="text-right text-xs">
          <div className="tabular text-sm"><span className="font-semibold">{n.encontrados ?? "—"}</span><span className="text-muted-foreground">/{n.previstos} vol</span></div>
          {done && <span className="inline-flex items-center gap-1 font-medium text-success"><CircleCheck className="size-3.5" />Sem divergência</span>}
          {pend && <span className="inline-flex items-center gap-1 font-medium text-warning"><CircleAlert className="size-3.5" />{nfMap[n.status][0]}</span>}
          {n.status === "pendente" && <span className="text-muted-foreground">A conferir</span>}
        </div>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-4 px-4 pb-4">
          <div className="grid grid-cols-[auto_1fr] items-end gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Previstos</div>
              <div className="text-2xl font-semibold tabular">{n.previstos}</div>
            </div>
            <div>
              <label htmlFor={`enc-${n.nf}`} className="text-xs text-muted-foreground">Encontrados</label>
              <div className="mt-1 grid grid-cols-[44px_1fr_44px] overflow-hidden rounded-md border border-input bg-card focus-within:ring-2 focus-within:ring-ring/30">
                <button type="button" onClick={() => step(-1)} className="grid place-items-center border-r active:bg-muted" aria-label="Diminuir"><Minus className="size-4" /></button>
                <input id={`enc-${n.nf}`} type="number" inputMode="numeric" pattern="[0-9]*" min={0} value={d.encontrados} placeholder={String(n.previstos)}
                  onChange={(e) => upd({ encontrados: e.target.value })}
                  className="h-12 w-full bg-transparent text-center text-2xl font-semibold tabular outline-none placeholder:text-muted-foreground/50" />
                <button type="button" onClick={() => step(1)} className="grid place-items-center border-l active:bg-muted" aria-label="Aumentar"><Plus className="size-4" /></button>
              </div>
            </div>
          </div>
          {diff !== null && diff !== 0 && (
            <p className={cn("text-sm font-medium", diff < 0 ? "text-danger" : "text-warning")}>{diff < 0 ? `Faltam ${-diff} volume(s)` : `${diff} volume(s) a mais`}</p>
          )}

          {!showDiv ? (
            <div className="space-y-2">
              <button onClick={confirmarOk} className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary text-[15px] font-semibold text-primary-foreground active:bg-primary/90">
                <Check className="size-5" />{enc == null ? `Confirmar ${n.previstos} volumes` : "Confirmar sem divergência"}
              </button>
              <button onClick={() => setDivOpen(true)} className="h-11 w-full rounded-md text-sm font-medium text-muted-foreground active:bg-muted">Registrar divergência</button>
            </div>
          ) : (
            <div className="space-y-3 border-t pt-4">
              <div>
                <div className="text-xs font-medium text-muted-foreground">Tipo de pendência</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tipos.map((t) => (
                    <button key={t} onClick={() => upd({ tipo: t })} aria-pressed={d.tipo === t}
                      className={cn("h-10 rounded-md border px-3 text-sm", d.tipo === t ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card active:bg-muted")}>
                      {nfMap[t][0]}
                    </button>
                  ))}
                </div>
                {d.tipo === "localizacao" && <p className="mt-2 text-xs text-muted-foreground">“A localizar” não é tratado como falta definitiva.</p>}
              </div>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Observação (opcional)</span>
                <textarea value={d.obs} onChange={(e) => upd({ obs: e.target.value })} rows={2} placeholder="Ex.: caixa amassada, etiqueta ilegível"
                  className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-[15px] outline-none focus:ring-2 focus:ring-ring/30" />
              </label>
              <button onClick={registrar} disabled={!d.tipo}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-warning text-[15px] font-semibold text-primary-foreground disabled:opacity-40">
                Registrar pendência
              </button>
              {(diff === null || diff === 0) && (
                <button onClick={() => { setDivOpen(false); upd({ tipo: null }); }} className="h-10 w-full text-sm text-muted-foreground">Cancelar divergência</button>
              )}
              {!d.tipo && <p className="text-center text-xs text-muted-foreground">Escolha o tipo para registrar.</p>}
            </div>
          )}
          {n.registradoPor && <p className="text-xs text-muted-foreground">Último registro: {n.registradoPor} · {n.registradoEm}</p>}
        </div>
      )}
    </li>
  );
}
