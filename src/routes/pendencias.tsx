import { createFileRoute } from "@tanstack/react-router";
import { CaseCenter } from "@/components/case-center";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/pendencias")({
  head: () => meta("Faltas e divergências", "Acompanhamento interno POA."),
  validateSearch: (s: Record<string, unknown>): { operacao?: string; caso?: string } => ({
    ...(typeof s["operacao"] === "string" ? { operacao: s["operacao"] } : {}),
    ...(typeof s["caso"] === "string" ? { caso: s["caso"] } : {}),
  }),
  component: Page,
});
function Page() {
  const s = Route.useSearch();
  return (
    <CaseCenter
      key={`${s["operacao"] || ""}-${s["caso"] || ""}`}
      initialOperation={s["operacao"] || ""}
      initialCase={s["caso"] || ""}
    />
  );
}
