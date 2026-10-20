import { createFileRoute } from "@tanstack/react-router";
import { FieldOperations } from "@/components/field-conference";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/conferir/")({
  head: () => meta("Conferir carga", "Conferência por cliente no celular."),
  component: FieldOperations,
});
