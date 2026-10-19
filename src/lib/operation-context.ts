import { createContext, useContext } from "react";
import type { State, NoteInput, Case, Operation } from "./operation-model";
import type { NotaFiscal } from "./demo-data";

type ContextValue = {
  state: State;
  record: (id: string, input: NoteInput) => void;
  changeOperation: (id: string, status: Operation["status"]) => void;
  updateCase: (id: string, patch: Partial<Case>) => void;
  addOperation: (
    data: Pick<Operation, "origem" | "placa" | "motorista" | "doca" | "responsavel"> & {
      chegada?: string;
    },
    rows: Pick<NotaFiscal, "nf" | "pedido" | "destinatario" | "previstos" | "praca" | "pallet">[],
  ) => string;
};
export const OperationContext = createContext<ContextValue | null>(null);

export function useOperations() {
  const c = useContext(OperationContext);
  if (!c) throw new Error("OperationProvider ausente");
  return c;
}
