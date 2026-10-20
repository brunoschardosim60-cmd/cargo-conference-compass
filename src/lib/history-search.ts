import type { State } from "./operation-model";
import { searchText } from "./operation-search";
export function historyContext(state: State, event: State["history"][number]) {
  const other = state.otherPlaces.find((p) => p.id === event.ref);
  const item = state.cases.find((c) => c.id === event.ref);
  const note = state.notes.find((n) =>
    event.notaId
      ? n.id === event.notaId
      : item
        ? n.conferencia === item.conferencia &&
          (item.noteId ? n.id === item.noteId : n.nf === item.nf)
        : n.conferencia === event.ref && event.descricao.includes(`NF ${n.nf}`),
  );
  const operation = state.operations.find(
    (o) => o.id === (note?.conferencia || item?.conferencia || event.ref),
  );
  return {
    other,
    item,
    note,
    operation,
    title: other
      ? `NF ${other.nf || "não informada"} · ${other.identificacao || other.destino}`
      : note || item
        ? `NF ${note?.nf || item?.nf} · ${note?.destinatario || item?.cliente}`
        : operation
          ? `${operation.placa} · ${operation.origem}`
          : event.ref,
    terms: [
      event.descricao,
      event.ref,
      event.usuario,
      other?.nf,
      other?.identificacao,
      other?.cliente,
      other?.destino,
      note?.nf,
      note?.destinatario,
      note?.praca,
      item?.cliente,
      operation?.placa,
      operation?.origem,
    ].join(" "),
  };
}
export function historyMatches(
  state: State,
  event: State["history"][number],
  query: string,
  date = "",
  user = "",
) {
  const day = /^\d{4}-\d{2}-\d{2}/.test(event.quando)
    ? event.quando.slice(0, 10)
    : /^e\d+$/.test(event.id) && /^\d{2}\/\d{2}/.test(event.quando) // Explicitly dated October 2026 seed records.
      ? `2026-${event.quando.slice(3, 5)}-${event.quando.slice(0, 2)}`
      : "";
  return (
    (!date || day === date) &&
    (!user || event.usuario === user) &&
    searchText(historyContext(state, event).terms).includes(searchText(query))
  );
}
