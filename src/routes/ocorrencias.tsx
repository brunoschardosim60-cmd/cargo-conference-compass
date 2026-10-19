import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, NotConnected } from "@/components/ui-kit";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/ocorrencias")({
  head: () => meta("Ocorrências", "Referências de ocorrências oficiais e acompanhamento da torre."),
  component: () => (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader title="Ocorrências" subtitle="Referências de ocorrências oficiais e acompanhamento da torre." />
      <NotConnected>Módulo em preparação — será detalhado na próxima etapa.</NotConnected>
      <Panel><p className="text-sm text-muted-foreground">Nenhum dado conectado ainda.</p></Panel>
    </div>
  ),
});
