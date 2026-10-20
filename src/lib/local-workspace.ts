import { z } from "zod";
import type { State } from "./operation-model";

// Evaluation storage only. Never a substitute for authenticated server persistence.
export const WORKSPACE_KEY = "poa-evaluation-v1";
const text = z.string();
const count = z.number().int().nonnegative().safe();
const nfStatus = z.enum([
  "pendente",
  "conferida",
  "falta",
  "avaria",
  "excedente",
  "divergencia",
  "localizacao",
]);
const product = z.object({
  lines: z.array(z.object({ boxes: count, units: count })),
  total: count,
  expected: count.optional(),
});
const photo = z.object({
  id: text,
  name: text,
  createdAt: text,
  data: text.regex(/^data:image\/(jpeg|png|webp);base64,/),
});
const discovery = z.object({
  id: text,
  quantity: count,
  description: text,
  actor: text,
  at: text,
  state: z.enum(["pending", "validated", "rejected"]),
  photos: z.array(photo).optional(),
  decision: z.object({ actor: text, at: text, reason: text }).optional(),
});
const noteInput = z.object({
  encontrados: count,
  status: nfStatus,
  observacao: text,
  calculo: text.optional(),
  produtos: product.optional(),
  photos: z.array(photo).optional(),
});
const storedState = z
  .object({
    operations: z.array(
      z
        .object({
          id: text,
          origem: text,
          chegada: text,
          motorista: text,
          placa: text,
          responsavel: text,
          notas: count,
          volumes: count,
          conferidos: count,
          doca: text.optional(),
          status: z.enum(["em_andamento", "pausada", "concluida", "aguardando"]),
          iniciadaEm: text.optional(),
          concluidaEm: text.optional(),
        })
        .passthrough(),
    ),
    notes: z.array(
      noteInput
        .extend({
          id: text,
          conferencia: text,
          nf: text,
          previstos: count,
          encontrados: count.nullable(),
          peso: z.number().nullable(),
          pedido: text,
          remetente: text,
          destinatario: text,
          praca: text,
          pallet: text,
          registradoPor: text.optional(),
          registradoEm: text.optional(),
        })
        .passthrough(),
    ),
    cases: z.array(
      z
        .object({
          id: text,
          nf: text,
          conferencia: text,
          cliente: text,
          tipo: nfStatus,
          registradoPor: text,
          registradoEm: text,
          data: text,
          proximaAcao: text,
          comentarios: count,
          status: z.enum([
            "nova",
            "analise",
            "aguardando_localizacao",
            "aguardando_registro",
            "aguardando_retorno",
            "resolvida",
            "cancelada",
          ]),
          discoveries: z.array(discovery).optional(),
          registroOriginal: noteInput
            .extend({ previstos: count, usuario: text, quando: text })
            .optional(),
        })
        .passthrough(),
    ),
    history: z.array(
      z
        .object({ id: text, descricao: text, quando: text, usuario: text, tipo: text, ref: text })
        .passthrough(),
    ),
  })
  .passthrough();

export function loadWorkspace() {
  const raw = localStorage.getItem(WORKSPACE_KEY);
  if (!raw) return { raw: null, state: null };
  const result = storedState.safeParse(JSON.parse(raw));
  if (!result.success)
    throw new Error(
      "Os dados locais não puderam ser lidos. Eles foram preservados; não serão substituídos.",
    );
  return { raw, state: result.data as unknown as State };
}

export function persistWorkspace(state: State, previous: string | null) {
  if (localStorage.getItem(WORKSPACE_KEY) !== previous)
    throw new Error("Outra aba alterou estes dados. Recarregue a página antes de continuar.");
  const serialized = JSON.stringify(state);
  localStorage.setItem(WORKSPACE_KEY, serialized);
  if (localStorage.getItem(WORKSPACE_KEY) !== serialized)
    throw new Error("Não foi possível confirmar a gravação neste aparelho.");
  return serialized;
}
