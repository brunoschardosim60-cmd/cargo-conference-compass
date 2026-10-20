import { createContext, useContext } from "react";
import type { State, NoteInput, Case, Operation, Evidence } from "./operation-model";
import type { OperationData, OperationRow } from "./receiving-create";
import type { PdfSource } from "./pdf-import";
import type { OtherPlaceInput } from "./other-places";

type ContextValue = {
  state: State;
  saveOther: (id: string | null, input: OtherPlaceInput) => string;
  reportFound: (caseId: string, quantity: number, description: string, photos: Evidence[]) => void;
  validateFound: (caseId: string, reportId: string, accepted: boolean, reason: string) => void;
  record: (id: string, input: NoteInput) => void;
  changeOperation: (id: string, status: Operation["status"]) => void;
  updateCase: (id: string, patch: Partial<Case>) => void;
  addOperation: (data: OperationData, rows: OperationRow[], source?: PdfSource) => string;
};
export const OperationContext = createContext<ContextValue | null>(null);

export function useOperations() {
  const c = useContext(OperationContext);
  if (!c) throw new Error("OperationProvider ausente");
  return c;
}
