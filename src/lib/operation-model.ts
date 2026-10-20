import {
  conferencias,
  notas,
  ocorrencias,
  eventos,
  type Conferencia,
  type NotaFiscal,
  type Ocorrencia,
  type Evento,
  type NfStatus,
} from "./demo-data";
import { calculateCount } from "./count-calculator";
import { productError, productSummary, type ProductCount } from "./product-count";

export type Evidence = { id: string; name: string; data: string; createdAt: string };
export type Discovery = {
  id: string;
  quantity: number;
  description: string;
  actor: string;
  at: string;
  state: "pending" | "validated" | "rejected";
  decision?: { actor: string; at: string; reason: string };
  photos?: Evidence[];
};

export type Note = Omit<NotaFiscal, "peso"> & {
  id: string;
  observacao: string;
  peso: number | null;
  calculo?: string;
  produtos?: ProductCount | undefined;
  photos?: Evidence[];
};
export type Case = Ocorrencia & {
  codigoOficial?: string;
  providencia?: string;
  justificativa?: string;
  data: string;
  noteId?: string;
  recebimentoConfirmado?: boolean;
  registroOriginal?: NoteInput & { previstos: number; usuario: string; quando: string };
  discoveries?: Discovery[];
  updatedAt?: string;
};
export type Operation = Conferencia & { iniciadaEm?: string; concluidaEm?: string };
export type State = {
  operations: Operation[];
  notes: Note[];
  cases: Case[];
  history: (Evento & { notaId?: string })[];
};
export type NoteInput = {
  encontrados: number;
  status: NfStatus;
  observacao: string;
  calculo?: string;
  produtos?: ProductCount | undefined;
  photos?: Evidence[];
};

export function noteError(input: NoteInput, previstos: number) {
  const products = productError(input.produtos);
  if (products) return products;
  if (!Number.isSafeInteger(input.encontrados) || input.encontrados < 0)
    return "Informe uma quantidade inteira, igual ou maior que zero.";
  if (input.calculo) {
    try {
      if (calculateCount(input.calculo) !== input.encontrados)
        return "A conta não corresponde à quantidade encontrada. Revise a contagem.";
    } catch {
      return "Revise a conta usada na calculadora.";
    }
  }
  if (input.status === "pendente") return "Selecione o resultado da conferência.";
  if (input.status === "conferida" && input.encontrados !== previstos)
    return "Para marcar sem divergência, a quantidade encontrada deve ser igual à prevista.";
  if (input.status === "falta" && input.encontrados >= previstos)
    return "Uma falta confirmada exige quantidade menor que a prevista.";
  if (input.status === "excedente" && input.encontrados <= previstos)
    return "Um excedente exige quantidade maior que a prevista.";
  if (input.status !== "conferida" && !input.observacao.trim())
    return "Descreva a divergência para orientar o administrativo.";
  return "";
}

export function createDemoState(): State {
  // A coherent, deliberately small sample; legacy fixtures remain untouched.
  const sample = [
    ...notas,
    ...[
      { ...notas[6]!, nf: "000185101", conferencia: "CF-DEMO-0140", previstos: 18 },
      { ...notas[7]!, nf: "000185102", conferencia: "CF-DEMO-0140", previstos: 6 },
      {
        ...notas[0]!,
        nf: "000183871",
        conferencia: "CF-DEMO-0139",
        previstos: 10,
        encontrados: 9,
        status: "falta" as const,
      },
      { ...notas[6]!, nf: "000186001", conferencia: "CF-DEMO-0138", previstos: 30 },
      { ...notas[7]!, nf: "000186002", conferencia: "CF-DEMO-0138", previstos: 12 },
    ],
  ].map((n, i) => ({
    ...n,
    id: `note-${i}`,
    observacao:
      n.status === "falta"
        ? "Diferença identificada durante a contagem física. Aguardando análise."
        : n.status === "avaria"
          ? "Embalagem danificada. Verificar integridade da mercadoria."
          : "",
  }));
  return {
    operations: conferencias.map((c) => {
      const ns = sample.filter((n) => n.conferencia === c.id);
      return {
        ...c,
        notas: ns.length,
        volumes: ns.reduce((v, n) => v + n.previstos, 0),
        conferidos: ns.reduce((v, n) => v + (n.encontrados ?? 0), 0),
      };
    }),
    notes: sample,
    cases: ocorrencias.map((o) => ({ ...o, data: `2026-10-${o.registradoEm.slice(0, 2)}` })),
    history: eventos.map((e) =>
      e.id === "e6"
        ? {
            ...e,
            tipo: "demonstracao",
            descricao:
              "Relação de demonstração disponibilizada com 9 NFs. Extração de PDF ainda não conectada.",
          }
        : e,
    ),
  };
}

export function saveNote(
  state: State,
  id: string,
  input: NoteInput,
  actor: string,
  now: string,
  eventId: string,
): State {
  const before = state.notes.find((n) => n.id === id);
  if (!before) throw new Error("Nota não encontrada nesta operação.");
  const error = noteError(input, before.previstos);
  if (error) throw new Error(error);
  const operation = state.operations.find((c) => c.id === before.conferencia);
  if (!operation || operation.status !== "em_andamento")
    throw new Error("Inicie ou retome a conferência antes de registrar notas.");
  const calculo =
    input.calculo ?? (before.encontrados === input.encontrados ? before.calculo || "" : "");
  if (
    before.encontrados === input.encontrados &&
    before.status === input.status &&
    before.observacao === input.observacao &&
    (before.calculo || "") === calculo &&
    JSON.stringify(before.produtos) === JSON.stringify(input.produtos ?? before.produtos) &&
    JSON.stringify(before.photos || []) === JSON.stringify(input.photos ?? before.photos ?? [])
  )
    return state;
  const updated = { ...before, ...input, calculo, registradoPor: actor, registradoEm: now };
  const notes = state.notes.map((n) => (n.id === id ? updated : n));
  let cases = state.cases;
  const existing = cases.find(
    (c) =>
      c.conferencia === before.conferencia &&
      c.nf === before.nf &&
      (!c.noteId || c.noteId === before.id) &&
      !["resolvida", "cancelada"].includes(c.status),
  );
  if (input.status !== "conferida" && !existing) {
    cases = [
      {
        id: `PI-${eventId}`,
        nf: before.nf,
        conferencia: before.conferencia,
        cliente: before.destinatario,
        tipo: input.status,
        registradoPor: actor,
        registradoEm: now,
        data: now.slice(0, 10),
        status: "nova",
        proximaAcao: "Analisar divergência registrada no pavilhão",
        comentarios: 0,
        noteId: before.id,
        registroOriginal: {
          ...input,
          calculo,
          previstos: before.previstos,
          usuario: actor,
          quando: now,
        },
      },
      ...cases,
    ];
  } else if (existing) {
    cases = cases.map((c) =>
      c.id === existing.id
        ? {
            ...c,
            updatedAt: now,
            ...(input.status !== "conferida" ? { tipo: input.status } : {}),
          }
        : c,
    );
  }
  // Finding a volume does not automatically close an administrative case.
  return {
    ...state,
    notes,
    operations: state.operations.map((o) =>
      o.id === before.conferencia
        ? {
            ...o,
            conferidos: notes
              .filter((n) => n.conferencia === o.id)
              .reduce((sum, n) => sum + (n.encontrados ?? 0), 0),
          }
        : o,
    ),
    cases,
    history: [
      {
        id: eventId,
        quando: now,
        usuario: actor,
        tipo: "conferencia",
        notaId: before.id,
        ref: before.conferencia,
        descricao: `NF ${before.nf}: ${before.encontrados ?? "não contado"} → ${input.encontrados} volumes; ${before.status} → ${input.status}. Observação anterior: ${before.observacao || "nenhuma"}. Nova observação: ${input.observacao || "nenhuma"}. Conta anterior: ${before.calculo || "não utilizada"}. Conta atual: ${calculo || "não utilizada"}. Produtos antes: ${productSummary(before.produtos)}. Produtos agora: ${productSummary(updated.produtos)}. Fotos anexadas: ${updated.photos?.length || 0}.`,
      },
      ...state.history,
    ],
  };
}

export function reportDiscovery(state: State, caseId: string, report: Discovery): State {
  const item = state.cases.find((c) => c.id === caseId);
  if (!item || ["resolvida", "cancelada"].includes(item.status))
    throw new Error("Esta pendência já foi encerrada. Atualize a consulta.");
  if (!Number.isSafeInteger(report.quantity) || report.quantity <= 0 || !report.description.trim())
    throw new Error("Informe quantos volumes localizou e onde estão.");
  if (item.discoveries?.some((d) => d.state === "pending"))
    throw new Error("Já existe uma localização aguardando validação nesta pendência.");
  return {
    ...state,
    cases: state.cases.map((c) =>
      c.id === caseId
        ? {
            ...c,
            updatedAt: report.at,
            discoveries: [...(c.discoveries || []), { ...report, state: "pending" }],
          }
        : c,
    ),
    history: [
      {
        id: report.id,
        quando: report.at,
        usuario: report.actor,
        tipo: "localizacao_informada",
        ref: caseId,
        descricao: `${report.quantity} volume(s) localizado(s): ${report.description}. Aguardando validação administrativa; contagem original preservada.`,
      },
      ...state.history,
    ],
  };
}

export function decideDiscovery(
  state: State,
  caseId: string,
  reportId: string,
  accepted: boolean,
  reason: string,
  actor: string,
  at: string,
  eventId: string,
): State {
  const item = state.cases.find((c) => c.id === caseId);
  const report = item?.discoveries?.find((d) => d.id === reportId);
  if (
    !item ||
    !report ||
    report.state !== "pending" ||
    ["resolvida", "cancelada"].includes(item.status)
  )
    throw new Error("Esta localização não está disponível para validação.");
  if (!reason.trim()) throw new Error("Descreva o que foi verificado antes de validar.");
  return {
    ...state,
    cases: state.cases.map((c) =>
      c.id === caseId
        ? {
            ...c,
            updatedAt: at,
            discoveries: (c.discoveries || []).map((d) =>
              d.id === reportId
                ? {
                    ...d,
                    state: accepted ? "validated" : "rejected",
                    decision: { actor, at, reason: reason.trim() },
                  }
                : d,
            ),
          }
        : c,
    ),
    history: [
      {
        id: eventId,
        quando: at,
        usuario: actor,
        tipo: "validacao_localizacao",
        ref: caseId,
        descricao: `Localização ${reportId} ${accepted ? "validada" : "não confirmada"}: ${reason.trim()}. O encerramento da pendência exige uma ação separada.`,
      },
      ...state.history,
    ],
  };
}

export function needsCount(note: Note) {
  return note.status === "pendente" || note.encontrados === null;
}

export function canFinish(state: State, operationId: string) {
  const rows = state.notes.filter((n) => n.conferencia === operationId);
  return rows.length > 0 && rows.every((n) => !needsCount(n));
}
