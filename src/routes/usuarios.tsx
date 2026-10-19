import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, NotConnected } from "@/components/ui-kit";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/usuarios")({
  head: () => meta("Usuários e permissões", "Perfis: conferente, administrativo, torre operacional e administrador."),
  component: () => (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader title="Usuários e permissões" subtitle="Perfis: conferente, administrativo, torre operacional e administrador." />
      <NotConnected>Módulo em preparação — será detalhado na próxima etapa.</NotConnected>
      <Panel><p className="text-sm text-muted-foreground">Nenhum dado conectado ainda.</p></Panel>
    </div>
  ),
});
