import { createFileRoute } from "@tanstack/react-router";
import { ConferencesPage } from "@/components/conferences-page";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/conferencias/")({
  head: () => meta("Conferências", "Fila de operações POA."),
  component: ConferencesPage,
});
