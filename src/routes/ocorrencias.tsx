import { createFileRoute, redirect } from "@tanstack/react-router";
// Preserve old bookmarks without retaining a separate tower workflow.
export const Route = createFileRoute("/ocorrencias")({
  beforeLoad: () => {
    throw redirect({ to: "/pendencias", replace: true });
  },
});
