import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ChevronRight, Search, CircleCheck, CircleAlert } from "lucide-react";
import { CampoFrame, CampoTop, DemoTag, Progress } from "@/components/campo-ui";
import { conferencias } from "@/lib/demo-data";
import { clientesDa, useNotas } from "@/lib/campo-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/campo/$id/")({
  head: ({ params }) => ({
    meta: [
      { title: `Clientes da carga ${params.id} · Conferência POA` },
      { name: "description", content: "Clientes e notas fiscais da carga para conferência no pavilhão." },
      { property: "og:title", content: `Clientes da carga ${params.id}` },
      { property: "og:description", content: "Selecione o cliente para conferir notas e volumes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const conf = conferencias.find((c) => c.id === id) ?? conferencias[0]!;
  const all = useNotas();
  const [q, setQ] = useState("");
  const [info, setInfo] = useState(false);
  const clientes = clientesDa(conf.id, all);
  const ql = q.trim().toLowerCase();
  const list = clientes.filter((c) => !ql || c.nome.toLowerCase().includes(ql) || c.notas.some((n) => n.nf.includes(ql) || n.pedido.toLowerCase().includes(ql)));
  const ns = clientes.flatMap((c) => c.notas);
  const feitas = ns.filter((n) => n.status !== "pendente").length;

  return (
    <CampoFrame>
      <CampoTop back="/campo" title={<span className="font-mono">{conf.placa}</span>} sub={`${conf.origem}${conf.doca ? ` · Doca ${conf.doca}` : ""}`} right={<DemoTag />} />

      <div className="border-b px-4 py-3">
        <button onClick={() => setInfo(!info)} className="flex w-full items-center gap-3 text-left" aria-expanded={info}>
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground"><span>{feitas} de {ns.length} notas registradas</span><span>Detalhes</span></div>
            <Progress value={ns.length ? (feitas / ns.length) * 100 : 0} />
          </div>
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", info && "rotate-180")} />
        </button>
        {info && (
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Operação</dt><dd className="font-mono">{conf.id}</dd>
            <dt className="text-muted-foreground">Motorista</dt><dd>{conf.motorista}</dd>
            <dt className="text-muted-foreground">Chegada</dt><dd className="tabular">{conf.chegada}</dd>
            <dt className="text-muted-foreground">Total</dt><dd className="tabular">{conf.notas} NFs · {conf.volumes} volumes</dd>
          </dl>
        )}
      </div>

      <div className="sticky top-14 z-10 border-b bg-card px-4 py-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cliente, NF ou pedido" inputMode="search"
            className="h-11 w-full rounded-md border border-input bg-background pl-9 pr-3 text-[15px] outline-none focus:ring-2 focus:ring-ring/30" />
        </div>
      </div>

      {list.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-muted-foreground">{clientes.length === 0 ? "Esta carga ainda não tem notas liberadas para conferência." : "Nenhum cliente, NF ou pedido encontrado."}</p>
      ) : (
        <ul className="divide-y">
          {list.map((c) => {
            const ok = c.pendentes === 0 && c.comPendencia === 0;
            return (
              <li key={c.nome}>
                <Link to="/campo/$id/$cliente" params={{ id: conf.id, cliente: c.nome }} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-3 active:bg-muted">
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-medium">{c.nome}</div>
                    <div className="text-xs tabular text-muted-foreground">{c.notas.length} NF · {c.volumes} vol</div>
                  </div>
                  <div className="text-right text-xs font-medium">
                    {c.pendentes > 0 && <div className="text-muted-foreground">{c.pendentes} a conferir</div>}
                    {c.comPendencia > 0 && <div className="inline-flex items-center gap-1 text-warning"><CircleAlert className="size-3.5" />{c.comPendencia} c/ pendência</div>}
                    {ok && <div className="inline-flex items-center gap-1 text-success"><CircleCheck className="size-3.5" />Conferido</div>}
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </CampoFrame>
  );
}
