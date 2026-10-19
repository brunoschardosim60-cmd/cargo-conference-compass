import { createFileRoute } from "@tanstack/react-router";
import { CaseCenter } from "@/components/case-center";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/pendencias")({
  head: () => meta("Central de pendências", "Tratamento administrativo das divergências."),
  component: () => <CaseCenter />,
});
