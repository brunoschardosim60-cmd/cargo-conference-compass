import { useState, type ReactNode } from "react";
import { OperationContext } from "@/lib/operation-context";
import {
  canFinish,
  createDemoState,
  saveNote,
  type State,
  type NoteInput,
  type Case,
  type Operation,
} from "@/lib/operation-model";
import type { NotaFiscal } from "@/lib/demo-data";

const actor = "Ana P. · demonstração";
const timestamp = () => new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" });
export function OperationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(createDemoState);
  function record(id: string, input: NoteInput) {
    const now = timestamp(),
      uid = crypto.randomUUID();
    setState((s) => saveNote(s, id, input, actor, now, uid));
  }
  function changeOperation(id: string, status: Operation["status"]) {
    const now = timestamp(),
      uid = crypto.randomUUID();
    setState((s) => {
      const current = s.operations.find((o) => o.id === id);
      if (!current || current.status === status || status === "aguardando") return s;
      if (status === "concluida" && (current.status !== "em_andamento" || !canFinish(s, id)))
        return s;
      if (status === "pausada" && current.status !== "em_andamento") return s;
      if (status === "em_andamento" && current.status === "concluida") return s;
      return {
        ...s,
        operations: s.operations.map((o) =>
          o.id === id
            ? {
                ...o,
                status,
                ...(status === "em_andamento" && !o.iniciadaEm ? { iniciadaEm: now } : {}),
                ...(status === "concluida" ? { concluidaEm: now } : {}),
              }
            : o,
        ),
        history: [
          {
            id: uid,
            quando: now,
            usuario: actor,
            tipo: "operacao",
            ref: id,
            descricao: `Conferência: ${current.status} → ${status}.`,
          },
          ...s.history,
        ],
      };
    });
  }
  function updateCase(id: string, patch: Partial<Case>) {
    const now = timestamp(),
      uid = crypto.randomUUID();
    setState((s) => {
      const before = s.cases.find((c) => c.id === id);
      if (
        !before ||
        ["resolvida", "cancelada"].includes(before.status) ||
        (patch.status &&
          ["resolvida", "cancelada"].includes(patch.status) &&
          !patch.justificativa?.trim())
      )
        return s;
      const updated = { ...before, ...patch };
      if (Object.entries(patch).every(([key, value]) => before[key as keyof Case] === value))
        return s;
      return {
        ...s,
        cases: s.cases.map((c) => (c.id === id ? updated : c)),
        history: [
          {
            id: uid,
            quando: now,
            usuario: actor,
            tipo: "tratamento",
            ref: id,
            descricao: `Tratamento interno: ${before.status} → ${updated.status}. Responsável: ${before.responsavel || "não atribuído"} → ${updated.responsavel || "não atribuído"}. Providência anterior: ${before.providencia || "nenhuma"}. Nova: ${updated.providencia || "nenhuma"}. Referência oficial anterior: ${before.codigoOficial || "não informada"}. Referência oficial informada manualmente: ${updated.codigoOficial || "não informada"}. Justificativa: ${updated.justificativa || "nenhuma"}.`,
          },
          ...s.history,
        ],
      };
    });
  }
  function addOperation(
    data: Pick<Operation, "origem" | "placa" | "motorista" | "doca" | "responsavel"> & {
      chegada?: string;
    },
    rows: Pick<NotaFiscal, "nf" | "pedido" | "destinatario" | "previstos" | "praca" | "pallet">[],
  ) {
    const id = `CF-LOCAL-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`,
      now = timestamp();
    const eventId = crypto.randomUUID();
    const notes = rows.map((n) => ({
      ...n,
      id: crypto.randomUUID(),
      conferencia: id,
      remetente: "",
      peso: null,
      encontrados: null,
      status: "pendente" as const,
      observacao: "",
    }));
    setState((s) => ({
      ...s,
      operations: [
        {
          ...data,
          id,
          chegada: data.chegada?.replace("T", " ") || "Não informada",
          status: "aguardando",
          notas: rows.length,
          volumes: rows.reduce((a, n) => a + n.previstos, 0),
          conferidos: 0,
        },
        ...s.operations,
      ],
      notes: [...s.notes, ...notes],
      history: [
        {
          id: eventId,
          quando: now,
          usuario: actor,
          tipo: "criada",
          ref: id,
          descricao: "Operação de demonstração criada por digitação manual.",
        },
        ...s.history,
      ],
    }));
    return id;
  }
  return (
    <OperationContext.Provider value={{ state, record, changeOperation, updateCase, addOperation }}>
      {children}
    </OperationContext.Provider>
  );
}
