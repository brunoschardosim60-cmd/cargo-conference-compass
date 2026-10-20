import { extraviados, type ExtStatus } from "./demo-data";
import type { Evidence, State } from "./operation-model";

export type OtherPlace = {
  id: string;
  nf: string;
  identificacao: string;
  cliente: string;
  origem: string;
  destino: string;
  volumes: number;
  identificadoEm: string;
  responsavel: string;
  observacao: string;
  photos: Evidence[];
  status: ExtStatus | "recebido";
  carreta: string;
  enviadoEm: string;
  recebidoEm: string;
  confirmacao: string;
  codigoOficial: string;
  criadoPor: string;
  atualizadoEm: string;
  version: number;
};
export type OtherPlaceInput = Omit<OtherPlace, "id" | "criadoPor" | "atualizadoEm" | "version">;
export const otherPlaceLabels: Record<OtherPlace["status"], string> = {
  identificado: "Identificado",
  aguardando_ocorrencia: "Aguardando registro",
  aguardando_retorno: "Aguardando encaminhamento",
  encaminhado: "Enviado",
  confirmacao_pendente: "Recebimento a confirmar",
  recebido: "Recebimento confirmado",
};
export function demoOtherPlaces(): OtherPlace[] {
  return extraviados.map((e) => ({
    id: e.id,
    nf: e.nf,
    identificacao: e.etiqueta,
    cliente: "",
    origem: e.origem,
    destino: e.destino,
    volumes: e.volumes,
    identificadoEm: "",
    responsavel: "",
    observacao: "",
    photos: [],
    status: e.status,
    carreta: e.carretaRetorno || "",
    enviadoEm: e.encaminhamento ? `2026-10-${e.encaminhamento.slice(0, 2)}` : "",
    recebidoEm: "",
    confirmacao: "",
    codigoOficial: e.oc75 || "",
    criadoPor: "Amostra legada",
    atualizadoEm: "",
    version: 0,
  }));
}
export const emptyOtherPlace = (): OtherPlaceInput => ({
  nf: "",
  identificacao: "",
  cliente: "",
  origem: "",
  destino: "",
  volumes: 1,
  identificadoEm: "",
  responsavel: "",
  observacao: "",
  photos: [],
  status: "identificado",
  carreta: "",
  enviadoEm: "",
  recebidoEm: "",
  confirmacao: "",
  codigoOficial: "",
});
export function otherPlaceInput(item: OtherPlace): OtherPlaceInput {
  return Object.fromEntries(
    Object.keys(emptyOtherPlace()).map((key) => [key, item[key as keyof OtherPlaceInput]]),
  ) as OtherPlaceInput;
}
function validDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
  const parsed = new Date(value);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.getFullYear() === Number(value.slice(0, 4)) &&
    parsed.getMonth() + 1 === Number(value.slice(5, 7)) &&
    parsed.getDate() === Number(value.slice(8, 10)) &&
    parsed.getHours() === Number(value.slice(11, 13)) &&
    parsed.getMinutes() === Number(value.slice(14, 16))
  );
}
export function saveOtherPlace(
  state: State,
  id: string,
  input: OtherPlaceInput,
  actor: string,
  at: string,
  eventId: string,
): State {
  const before = state.otherPlaces.find((p) => p.id === id);
  if (!Object.hasOwn(otherPlaceLabels, input.status))
    throw new Error("Selecione uma situação válida.");
  if (
    (!input.nf.trim() && !input.identificacao.trim()) ||
    !input.destino.trim() ||
    !input.responsavel.trim()
  )
    throw new Error("Informe NF ou identificação, destino correto e responsável.");
  if (!Number.isSafeInteger(input.volumes) || input.volumes <= 0)
    throw new Error("Informe uma quantidade inteira de volumes, maior que zero.");
  if (!validDateTime(input.identificadoEm))
    throw new Error("Informe a data e a hora da identificação.");
  const sent = ["encaminhado", "confirmacao_pendente", "recebido"].includes(input.status);
  if (
    before &&
    ["encaminhado", "confirmacao_pendente", "recebido"].includes(before.status) &&
    !sent
  )
    throw new Error("Um envio registrado não pode ser apagado pela mudança de situação.");
  if (before?.status === "recebido" && input.status !== "recebido")
    throw new Error("Um recebimento confirmado não pode ser removido.");
  if (sent && (!input.carreta.trim() || !validDateTime(input.enviadoEm)))
    throw new Error("Informe a carreta e a data de saída antes de registrar o envio.");
  if (!sent && (input.enviadoEm || input.recebidoEm))
    throw new Error("Selecione Enviado para registrar a saída.");
  if (input.enviadoEm && Date.parse(input.enviadoEm) < Date.parse(input.identificadoEm))
    throw new Error("A saída não pode ser anterior à identificação.");
  if (
    input.status === "recebido" &&
    (!validDateTime(input.recebidoEm) || !input.confirmacao.trim())
  )
    throw new Error("Informe quando o recebimento foi confirmado e por qual evidência ou contato.");
  if (input.status !== "recebido" && input.recebidoEm)
    throw new Error("Selecione Recebimento confirmado para registrar essa data.");
  if (input.recebidoEm && Date.parse(input.recebidoEm) < Date.parse(input.enviadoEm))
    throw new Error("O recebimento não pode ser anterior à saída.");
  const item: OtherPlace = {
    ...input,
    id,
    criadoPor: before?.criadoPor || actor,
    atualizadoEm: at,
    version: (before?.version || 0) + 1,
  };
  if (
    before &&
    Object.entries(input).every(
      ([key, value]) => JSON.stringify(before[key as keyof OtherPlace]) === JSON.stringify(value),
    )
  )
    return state;
  const changes = before
    ? Object.keys(input)
        .filter(
          (key) =>
            key !== "photos" && before[key as keyof OtherPlace] !== item[key as keyof OtherPlace],
        )
        .map(
          (key) =>
            `${key}: ${String(before[key as keyof OtherPlace] || "não informado")} → ${String(item[key as keyof OtherPlace] || "não informado")}`,
        )
        .join("; ")
    : `Identificado em ${input.identificadoEm}; destino ${input.destino}; ${input.volumes} volumes; responsável ${input.responsavel}. ${input.observacao}`;
  return {
    ...state,
    otherPlaces: before
      ? state.otherPlaces.map((p) => (p.id === id ? item : p))
      : [item, ...state.otherPlaces],
    history: [
      {
        id: eventId,
        ref: id,
        quando: at,
        usuario: actor,
        tipo: before ? "outra_praca_atualizada" : "outra_praca_identificada",
        descricao: `${before ? "Atualização" : "Identificação"} de outra praça · NF ${input.nf || "não informada"} · ${input.identificacao}. ${changes} Fotos: ${before?.photos.length || 0} → ${input.photos.length}.`,
        photos: input.photos.filter((photo) => !before?.photos.some((p) => p.id === photo.id)),
      },
      ...state.history,
    ],
  };
}
