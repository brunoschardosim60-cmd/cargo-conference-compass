import { needsCount, type Note } from "./operation-model";

export function clientGroups(notes: Note[], operationId: string, query = "") {
  const groups = new Map<string, Note[]>();
  for (const note of notes.filter((n) => n.conferencia === operationId)) {
    const client = note.destinatario.trim() || "Destinatário não informado";
    groups.set(client, [...(groups.get(client) || []), note]);
  }
  const term = query.trim().toLocaleLowerCase("pt-BR");
  return [...groups]
    .map(([name, rows]) => ({
      name,
      rows,
      remaining: rows.filter(needsCount).length,
      issues: rows.filter((n) => !needsCount(n) && n.status !== "conferida").length,
      expected: rows.reduce((sum, n) => sum + n.previstos, 0),
    }))
    .filter((g) =>
      g.rows.some((n) =>
        [g.name, n.nf, n.pedido, n.praca].join(" ").toLocaleLowerCase("pt-BR").includes(term),
      ),
    );
}
