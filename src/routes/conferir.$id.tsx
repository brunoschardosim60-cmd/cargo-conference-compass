import { createFileRoute } from "@tanstack/react-router";
import { FieldConference } from "@/components/field-conference";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/conferir/$id")({
  head: () => meta("Conferir cliente", "Contagem física da carga."),
  component: Page,
});
function Page() {
  const { id } = Route.useParams();
  return <FieldConference key={id} id={id} />;
}
