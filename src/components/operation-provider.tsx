import { useState, useRef, useEffect, type ReactNode } from "react";
import { OperationContext } from "@/lib/operation-context";
import {
  canFinish,
  createDemoState,
  saveNote,
  reportDiscovery,
  decideDiscovery,
  type Evidence,
  type State,
  type NoteInput,
  type Case,
  type Operation,
} from "@/lib/operation-model";
import type { NotaFiscal } from "@/lib/demo-data";
import { loadWorkspace, persistWorkspace } from "@/lib/local-workspace";
import { toast } from "sonner";

const actor = "Ana P. · demonstração";
const timestamp = () => new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" });
export function OperationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(createDemoState);
  const current = useRef(state);
  const raw = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  useEffect(() => {
    try {
      const saved = loadWorkspace();
      raw.current = saved.raw;
      if (saved.state) {
        current.current = saved.state;
        setState(saved.state);
      }
      setReady(true);
    } catch {
      setStorageError(
        "Não foi possível abrir os dados deste aparelho. Eles foram preservados. Libere o armazenamento do navegador ou tente novamente.",
      );
    }
  }, []);
  function commit(reducer: (state: State) => State) {
    try {
      if (!ready) throw new Error("Aguarde a leitura dos registros locais.");
      const updated = reducer(current.current);
      if (updated === current.current) return;
      raw.current = persistWorkspace(updated, raw.current);
      current.current = updated;
      setState(updated);
      setStorageError("");
    } catch (error) {
      const message =
        error instanceof Error && error.name !== "QuotaExceededError"
          ? error.message
          : "Armazenamento cheio ou indisponível. O registro não foi salvo; reduza as fotos e tente novamente.";
      setStorageError(message);
      toast.error(message);
      throw new Error(message);
    }
  }
  function reportFound(caseId: string, quantity: number, description: string, photos: Evidence[]) {
    commit((s) =>
      reportDiscovery(s, caseId, {
        id: crypto.randomUUID(),
        quantity,
        description: description.trim(),
        photos,
        actor,
        at: timestamp(),
        state: "pending",
      }),
    );
  }
  function validateFound(caseId: string, reportId: string, accepted: boolean, reason: string) {
    commit((s) =>
      decideDiscovery(
        s,
        caseId,
        reportId,
        accepted,
        reason,
        actor,
        timestamp(),
        crypto.randomUUID(),
      ),
    );
  }
  function record(id: string, input: NoteInput) {
    const now = timestamp(),
      uid = crypto.randomUUID();
    commit((s) => saveNote(s, id, input, actor, now, uid));
  }
  function changeOperation(id: string, status: Operation["status"]) {
    const now = timestamp(),
      uid = crypto.randomUUID();
    commit((s) => {
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
    commit((s) => {
      const before = s.cases.find((c) => c.id === id);
      if (
        !before ||
        ["resolvida", "cancelada"].includes(before.status) ||
        (patch.status &&
          ["resolvida", "cancelada"].includes(patch.status) &&
          !patch.justificativa?.trim())
      )
        return s;
      if (
        patch.status &&
        ["resolvida", "cancelada"].includes(patch.status) &&
        before.discoveries?.some((d) => d.state === "pending")
      )
        throw new Error("Valide as localizações informadas antes de encerrar a pendência.");
      const updated = { ...before, ...patch, updatedAt: now };
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
            descricao: `Tratamento interno: ${before.status} → ${updated.status}. Responsável: ${before.responsavel || "não atribuído"} → ${updated.responsavel || "não atribuído"}. Providência anterior: ${before.providencia || "nenhuma"}. Nova: ${updated.providencia || "nenhuma"}. Referência oficial anterior: ${before.codigoOficial || "não informada"}. Referência oficial informada manualmente: ${updated.codigoOficial || "não informada"}. Justificativa: ${updated.justificativa || "nenhuma"}. Verificação do recebimento/resolução: ${updated.recebimentoConfirmado ? "confirmada manualmente" : "não confirmada"}.`,
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
    commit((s) => ({
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
    <OperationContext.Provider
      value={{
        state,
        record,
        changeOperation,
        updateCase,
        addOperation,
        reportFound,
        validateFound,
      }}
    >
      {storageError && (
        <div role="alert" className="storage-error">
          {storageError}
        </div>
      )}
      {ready ? (
        children
      ) : (
        <p role="status" className="storage-loading">
          Abrindo registros deste aparelho…
        </p>
      )}
    </OperationContext.Provider>
  );
}
