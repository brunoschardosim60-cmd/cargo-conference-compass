import type { State, NoteInput, Evidence } from "./operation-model";
import type { OtherPlaceInput } from "./other-places";

/**
 * Contract for the future authenticated service; no endpoint is connected.
 * Server resolves actor/branch/permissions from the session, never from the payload.
 * Each command commits business data + audit event in one database transaction.
 */
export type ServerSession = {
  userId: string;
  displayName: string;
  branchId: string;
  role: "conferente" | "administrativo" | "administrador";
};
type Envelope = { requestId: string; expectedVersion: number };
export type OperationCommand = Envelope &
  (
    | {
        kind: "recordNote";
        noteId: string;
        input: Omit<NoteInput, "photos">;
        evidenceIds: string[];
      }
    | {
        kind: "changeOperation";
        operationId: string;
        status: "em_andamento" | "pausada" | "concluida";
      }
    | {
        kind: "reportFound";
        caseId: string;
        quantity: number;
        description: string;
        evidenceIds: string[];
      }
    | {
        kind: "validateFound";
        caseId: string;
        discoveryId: string;
        accepted: boolean;
        reason: string;
      }
    | {
        kind: "treatCase";
        caseId: string;
        ownerId: string;
        status: State["cases"][number]["status"];
        action: string;
        reason: string;
        officialReference: string;
        receiptVerified: boolean;
      }
    | {
        kind: "saveOtherPlace";
        id: string | null;
        input: Omit<OtherPlaceInput, "photos">;
        evidenceIds: string[];
      }
  );
export type CommandReply =
  | { ok: true; version: number; eventId: string; committedAt: string }
  | { ok: false; code: "unauthorized" | "forbidden" | "conflict" | "invalid"; message: string };
export interface AuthenticatedOperationsService {
  session(): Promise<ServerSession | null>;
  read(cursor?: string): Promise<{ state: State; cursor: string }>;
  execute(command: OperationCommand): Promise<CommandReply>;
  uploadEvidence(file: File, recordId: string): Promise<{ id: string; sha256: string }>;
  evidence(id: string): Promise<Pick<Evidence, "name"> & { signedUrl: string; expiresAt: string }>;
}
