import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, NotConnected } from "@/components/ui-kit";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/historico")({
  head: () => meta("Histórico", "Linha do tempo de eventos por conferência, NF e ocorrência."),
  component: () => (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader title="Histórico" subtitle="Linha do tempo de eventos por conferência, NF e ocorrência." />
      <NotConnected>Módulo em preparação — será detalhado na próxima etapa.</NotConnected>
      <Panel><p className="text-sm text-muted-foreground">Nenhum dado conectado ainda.</p></Panel>
    </div>
  ),
});
