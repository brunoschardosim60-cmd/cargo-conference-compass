import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { CampoFrame, CampoTop, DemoTag, Progress } from "@/components/campo-ui";
import { conferencias } from "@/lib/demo-data";
import { confMap } from "@/components/status";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/campo/")({
  head: () => meta("Cargas para conferir", "Lista de cargas da filial para o conferente no pavilhão."),
  component: Page,
});

function Page() {
  const abertas = conferencias.filter((c) => c.status !== "concluida");
  const concluidas = conferencias.filter((c) => c.status === "concluida");
  return (
    <CampoFrame>
      <CampoTop title="Cargas" sub="Filial POA" right={<DemoTag />} />
      <Section title="Para conferir" items={abertas} />
      <Section title="Concluídas hoje" items={concluidas} muted />
      <p className="px-4 py-6 text-center text-xs text-muted-foreground">Ambiente de demonstração · dados fictícios</p>
    </CampoFrame>
  );
}

function Section({ title, items, muted }: { title: string; items: typeof conferencias; muted?: boolean }) {
  return (
    <section>
      <h2 className="border-b bg-background px-4 pb-2 pt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">{title} · {items.length}</h2>
      <ul className="divide-y">
        {items.map((c) => {
          const pct = Math.round((c.conferidos / c.volumes) * 100);
          const [label, tone] = confMap[c.status];
          return (
            <li key={c.id}>
              <Link to="/campo/$id" params={{ id: c.id }} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 active:bg-muted ${muted ? "opacity-70" : ""}`}>
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-base font-semibold">{c.placa}</span>
                    <span className="truncate text-sm text-muted-foreground">{c.origem}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`font-medium text-${tone === "neutral" ? "muted-foreground" : tone}`}>{label}</span>
                    {c.doca && <span className="text-muted-foreground">Doca {c.doca}</span>}
                    <span className="ml-auto tabular text-muted-foreground">{pct}%</span>
                  </div>
                  <Progress value={pct} tone={pct === 100 ? "bg-success" : "bg-primary"} />
                </div>
                <ChevronRight className="size-5 text-muted-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
