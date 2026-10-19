import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, NotConnected } from "@/components/ui-kit";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/extraviados")({
  head: () => meta("Extraviados de outras praças", "Mercadorias recebidas que pertencem a outras filiais."),
  component: () => (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader title="Extraviados de outras praças" subtitle="Mercadorias recebidas que pertencem a outras filiais." />
      <NotConnected>Módulo em preparação — será detalhado na próxima etapa.</NotConnected>
      <Panel><p className="text-sm text-muted-foreground">Nenhum dado conectado ainda.</p></Panel>
    </div>
  ),
});
