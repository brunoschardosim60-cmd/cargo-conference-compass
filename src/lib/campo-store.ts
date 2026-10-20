// Estado da sessão de demonstração do conferente (memória do navegador, não gravado).
import { useSyncExternalStore } from "react";
import { notas as seed, type NotaFiscal } from "@/lib/demo-data";

export type NotaCampo = NotaFiscal & { obs?: string };

let state: NotaCampo[] = seed.map((n) => ({ ...n }));
const subs = new Set<() => void>();

export function useNotas() {
  return useSyncExternalStore(
    (cb) => (subs.add(cb), () => subs.delete(cb)),
    () => state,
    () => state,
  );
}

export function saveNota(nf: string, patch: Partial<NotaCampo>) {
  const now = new Date();
  const hora = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  state = state.map((n) => (n.nf === nf ? { ...n, ...patch, registradoPor: "Conferente (demo)", registradoEm: hora } : n));
  subs.forEach((s) => s());
  return hora;
}

export type Cliente = { nome: string; notas: NotaCampo[]; volumes: number; pendentes: number; comPendencia: number };

export function clientesDa(conf: string, all: NotaCampo[]): Cliente[] {
  const map = new Map<string, NotaCampo[]>();
  all.filter((n) => n.conferencia === conf).forEach((n) => map.set(n.destinatario, [...(map.get(n.destinatario) ?? []), n]));
  return [...map.entries()].map(([nome, ns]) => ({
    nome,
    notas: ns,
    volumes: ns.reduce((s, n) => s + n.previstos, 0),
    pendentes: ns.filter((n) => n.status === "pendente").length,
    comPendencia: ns.filter((n) => n.status !== "pendente" && n.status !== "conferida").length,
  }));
}
