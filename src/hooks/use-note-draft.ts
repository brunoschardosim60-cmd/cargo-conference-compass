import { useEffect, useState } from "react";
import type { NfStatus } from "@/lib/demo-data";
import type { Evidence } from "@/lib/operation-model";
import type { ProductCount } from "@/lib/product-count";

export type NoteDraft = {
  quantity: string;
  status: NfStatus;
  observation: string;
  calculation: string;
  divergence: boolean;
  products?: ProductCount | undefined;
  photos: Evidence[];
};
const key = (id: string) => `poa-note-draft-v1:${id}`;
export function readNoteDraft(id: string, baseRevision?: string): NoteDraft | null {
  try {
    const data = JSON.parse(localStorage.getItem(key(id)) || "null");
    if (
      !data ||
      data.baseRevision !== baseRevision ||
      typeof data.quantity !== "string" ||
      typeof data.observation !== "string" ||
      typeof data.calculation !== "string" ||
      typeof data.divergence !== "boolean" ||
      !Array.isArray(data.photos) ||
      ![
        "pendente",
        "conferida",
        "falta",
        "avaria",
        "excedente",
        "divergencia",
        "localizacao",
      ].includes(data.status)
    )
      return null;
    return data;
  } catch {
    return null;
  }
}
export function clearNoteDraft(id: string) {
  localStorage.removeItem(key(id));
}
export function useNoteDraft(id: string, value: NoteDraft, dirty: boolean, baseRevision?: string) {
  const serialized = JSON.stringify({ ...value, baseRevision });
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!dirty) {
      try {
        clearNoteDraft(id);
      } catch {
        /* No new input to lose. */
      }
      return;
    }
    setMessage("Salvando rascunho neste aparelho…");
    const save = () => {
      try {
        localStorage.setItem(key(id), serialized);
        if (localStorage.getItem(key(id)) !== serialized) throw new Error();
        setMessage("Rascunho salvo neste aparelho · falta confirmar a nota.");
      } catch {
        setMessage("Rascunho NÃO salvo. Armazenamento indisponível; mantenha esta tela aberta.");
      }
    };
    const timer = window.setTimeout(save, 300);
    window.addEventListener("beforeunload", save);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeunload", save);
    };
  }, [id, serialized, dirty]);
  return dirty ? message : "";
}
