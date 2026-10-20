import { createFileRoute } from "@tanstack/react-router";
import { OtherPlacesPage } from "@/components/other-places-page";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/extraviados")({
  head: () => meta("Outras praças", "Identificação, encaminhamento e recebimento."),
  validateSearch: (s: Record<string, unknown>): { registro?: string } =>
    typeof s["registro"] === "string" ? { registro: s["registro"] } : {},
  component: Page,
});
function Page() {
  const { registro } = Route.useSearch();
  return <OtherPlacesPage key={registro || "list"} initialId={registro || ""} />;
}
