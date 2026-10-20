import { createFileRoute } from "@tanstack/react-router";
import { ConferencesPage } from "@/components/conferences-page";
import { FieldOperations } from "@/components/field-conference";
import { useHandheld } from "@/hooks/use-handheld";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/")({
  head: () => meta("Conferências", "Recebimento e conferência POA."),
  component: Home,
});
function Home() {
  return useHandheld() ? <FieldOperations /> : <ConferencesPage />;
}
