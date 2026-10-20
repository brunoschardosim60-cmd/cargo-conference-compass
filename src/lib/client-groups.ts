import { needsCount, type Note } from "./operation-model";

export function clientGroups(notes: Note[], operationId: string, query = "") {
  const groups = new Map<string, Note[]>();
  for (const note of notes.filter((n) => n.conferencia === operationId)) {
    const client = note.destinatario.trim() || "Destinatário não informado";
    const key = JSON.stringify([client, note.praca.trim()]);
    groups.set(key, [...(groups.get(key) || []), note]);
  }
  const term = query.trim().toLocaleLowerCase("pt-BR");
  return [...groups]
    .map(([, rows]) => ({
      name: notes.some(
        (n) =>
          n.conferencia === operationId &&
          n.destinatario.trim() === rows[0]!.destinatario.trim() &&
          n.praca.trim() !== rows[0]!.praca.trim(),
      )
        ? `${rows[0]!.destinatario.trim()} · ${rows[0]!.praca || "Destino não informado"}`
        : rows[0]!.destinatario.trim() || "Destinatário não informado",
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
