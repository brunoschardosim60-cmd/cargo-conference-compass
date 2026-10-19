import { createFileRoute } from "@tanstack/react-router";
import { CaseCenter } from "@/components/case-center";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/ocorrencias")({
  head: () => meta("Acompanhamento da torre", "Localizações, retornos e resolução de pendências."),
  component: () => <CaseCenter tower />,
});
