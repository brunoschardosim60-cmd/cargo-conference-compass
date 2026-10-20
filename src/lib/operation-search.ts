import type { Operation, State } from "./operation-model";
export function searchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}
export function operationMatches(state: State, operation: Operation, query: string) {
  const term = searchText(query);
  return searchText(
    [
      operation.id,
      operation.placa,
      operation.motorista,
      operation.origem,
      ...state.notes
        .filter((n) => n.conferencia === operation.id)
        .flatMap((n) => [n.nf, n.pedido, n.destinatario, n.praca]),
    ].join(" "),
  ).includes(term);
}
export function openIssues(state: State, operationId: string) {
  return state.cases.filter(
    (c) => c.conferencia === operationId && !["resolvida", "cancelada"].includes(c.status),
  ).length;
}
export function arrivalDay(operation: Operation) {
  if (/^\d{4}-\d{2}-\d{2}/.test(operation.chegada)) return operation.chegada.slice(0, 10);
  // The original fixtures are explicitly from October 2026; never infer years for user data.
  if (operation.id.startsWith("CF-DEMO-") && /^\d{2}\/\d{2}/.test(operation.chegada))
    return `2026-${operation.chegada.slice(3, 5)}-${operation.chegada.slice(0, 2)}`;
  return "";
}
