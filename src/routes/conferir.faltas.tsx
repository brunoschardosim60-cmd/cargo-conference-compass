import { createFileRoute } from "@tanstack/react-router";
import { FieldShortages } from "@/components/field-shortages";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/conferir/faltas")({
  head: () => meta("Faltas em aberto", "Consulta rápida de pendências de POA."),
  component: FieldShortages,
});
