import type { Operation, State } from "./operation-model";
import type { NotaFiscal } from "./demo-data";
import type { PdfSource } from "./pdf-import";
export type OperationData = Pick<
  Operation,
  "origem" | "placa" | "motorista" | "doca" | "responsavel"
> & { chegada?: string };
export type OperationRow = Pick<
  NotaFiscal,
  "nf" | "pedido" | "destinatario" | "previstos" | "praca" | "pallet"
> & {
  documento?: string;
  remetente?: string;
  peso?: number | null;
  sourcePage?: number;
  sourceLine?: number;
};
export function createReceiving(
  state: State,
  data: OperationData,
  rows: OperationRow[],
  ids: { operation: string; event: string; notes: string[] },
  actor: string,
  at: string,
  source?: PdfSource,
): State {
  if (![data.origem, data.placa, data.motorista].every((s) => s.trim()))
    throw new Error("Informe origem, placa e motorista.");
  if (
    !rows.length ||
    rows.length !== ids.notes.length ||
    rows.some(
      (n) =>
        !/^\d{1,9}$/.test(n.nf.trim()) ||
        !n.destinatario.trim() ||
        !Number.isSafeInteger(n.previstos) ||
        n.previstos <= 0,
    )
  )
    throw new Error("Revise NF, destinatário e volumes inteiros de todas as linhas.");
  if (source && state.operations.some((o) => o.source?.sha256 === source.sha256))
    throw new Error(
      "Este PDF já foi importado neste aparelho. Abra a operação existente; não será criada uma cópia.",
    );
  const keys = rows.map((n) => `${n.documento || ""}|${n.nf.trim()}`);
  if (new Set(keys).size !== keys.length)
    throw new Error("Há documento e NF repetidos. Revise as linhas antes de confirmar.");
  const total = rows.reduce((s, n) => s + n.previstos, 0);
  if (!Number.isSafeInteger(total)) throw new Error("O total de volumes é inválido.");
  const notes = rows.map((n, i) => ({
    ...n,
    id: ids.notes[i]!,
    nf: n.nf.trim(),
    conferencia: ids.operation,
    remetente: n.remetente || "",
    peso: n.peso ?? null,
    encontrados: null,
    status: "pendente" as const,
    observacao: "",
  }));
  return {
    ...state,
    operations: [
      {
        ...data,
        id: ids.operation,
        chegada: data.chegada?.replace("T", " ") || "Não informada",
        status: "aguardando",
        notas: rows.length,
        volumes: total,
        conferidos: 0,
        ...(source ? { source } : {}),
      },
      ...state.operations,
    ],
    notes: [...state.notes, ...notes],
    history: [
      {
        id: ids.event,
        quando: at,
        usuario: actor,
        tipo: source ? "importacao" : "criada",
        ref: ids.operation,
        descricao: source
          ? `PDF importado após revisão humana: ${source.name}; ${source.pages} páginas; ${rows.length} notas; ${total} volumes físicos. SHA-256: ${source.sha256}. Ajustes: ${source.reviewReason || "sem divergência de totais declarada"}. Original preservado neste navegador.`
          : "Operação de avaliação criada por digitação manual.",
      },
      ...state.history,
    ],
  };
}
