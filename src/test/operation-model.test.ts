import { describe, expect, it } from "vitest";
import { canFinish, createDemoState, needsCount, noteError, saveNote } from "@/lib/operation-model";

describe("Contagem física e rastreabilidade", () => {
  it.each([-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "rejeita quantidade inválida: %s",
    (encontrados) => {
      expect(
        noteError({ encontrados, status: "localizacao", observacao: "Busca em curso" }, 10),
      ).toContain("inteira");
    },
  );
  it("não permite marcar uma quantidade diferente como sem divergência", () => {
    expect(noteError({ encontrados: 9, status: "conferida", observacao: "" }, 10)).not.toBe("");
  });
  it("aceita zero encontrado sem declarar falta definitiva", () => {
    expect(
      noteError(
        { encontrados: 0, status: "localizacao", observacao: "Verificar outro pallet" },
        10,
      ),
    ).toBe("");
  });
  it("exige observação para avaria mesmo com quantidade correta", () => {
    expect(noteError({ encontrados: 10, status: "avaria", observacao: " " }, 10)).toContain(
      "Descreva",
    );
  });
  it("distingue falta e excedente pela contagem", () => {
    expect(noteError({ encontrados: 11, status: "falta", observacao: "Teste" }, 10)).not.toBe("");
    expect(noteError({ encontrados: 9, status: "excedente", observacao: "Teste" }, 10)).not.toBe(
      "",
    );
  });
  it("isola notas de mesmo número em operações diferentes", () => {
    const s = createDemoState(),
      note = s.notes[6]!;
    s.notes.push({ ...note, id: "outra-nota", conferencia: "CF-DEMO-0138" });
    const result = saveNote(
      s,
      note.id,
      { encontrados: 9, status: "localizacao", observacao: "Um volume a localizar" },
      "Conferente teste",
      "2026-10-19 10:00",
      "teste1",
    );
    expect(result.notes.find((n) => n.id === "outra-nota")?.encontrados).toBeNull();
    expect(result.notes.find((n) => n.id === note.id)?.encontrados).toBe(9);
    expect(result.cases[0]?.conferencia).toBe(note.conferencia);
    expect(s.notes.find((n) => n.id === note.id)?.encontrados).toBeNull();
  });
  it("não duplica pendência aberta ao corrigir a mesma nota", () => {
    const s = createDemoState(),
      note = s.notes[1]!;
    const result = saveNote(
      s,
      note.id,
      { encontrados: 7, status: "localizacao", observacao: "Um volume localizado" },
      "Conferente teste",
      "2026-10-19 10:00",
      "teste2",
    );
    expect(result.cases.length).toBe(s.cases.length);
    expect(result.history[0]?.descricao).toContain("6 → 7");
    expect(result.history[0]?.descricao).toContain("falta → localizacao");
    expect(result.history[0]?.descricao).toContain("Observação anterior:");
  });
  it("localização posterior preserva a pendência administrativa e seu histórico", () => {
    const s = createDemoState(),
      note = s.notes[1]!;
    const result = saveNote(
      s,
      note.id,
      { encontrados: 8, status: "conferida", observacao: "Volumes encontrados no pallet P-02" },
      "Torre teste",
      "2026-10-19 11:00",
      "teste3",
    );
    expect(result.cases[0]?.status).toBe("nova");
    expect(result.cases[0]?.tipo).toBe("falta");
    expect(result.history.length).toBe(s.history.length + 1);
  });
  it("bloqueia edição de conferência concluída", () => {
    const s = createDemoState(),
      note = s.notes.find((n) => n.conferencia === "CF-DEMO-0141")!;
    expect(() =>
      saveNote(
        s,
        note.id,
        { encontrados: 9, status: "conferida", observacao: "" },
        "Teste",
        "agora",
        "x",
      ),
    ).toThrow("retome");
  });
  it("bloqueia operação inexistente, vazia ou com contagem incompleta", () => {
    const s = createDemoState();
    expect(canFinish(s, "inexistente")).toBe(false);
    expect(canFinish(s, "CF-DEMO-0142")).toBe(false);
    expect(canFinish(s, "CF-DEMO-0141")).toBe(true);
  });
  it("inclui notas a localizar sem quantidade na fila de contagem", () => {
    const s = createDemoState();
    const note = s.notes.find((n) => n.status === "localizacao")!;
    expect(needsCount(note)).toBe(true);
    expect(needsCount({ ...note, encontrados: 0 })).toBe(false);
    expect(needsCount({ ...note, encontrados: 0, status: "pendente" })).toBe(true);
  });
  it("atualiza o total encontrado somente na operação editada", () => {
    const s = createDemoState(),
      note = s.notes[6]!;
    const result = saveNote(
      s,
      note.id,
      { encontrados: 10, status: "conferida", observacao: "" },
      "Teste",
      "agora",
      "total",
    );
    expect(result.operations.find((o) => o.id === note.conferencia)?.conferidos).toBe(
      s.operations.find((o) => o.id === note.conferencia)!.conferidos + 10,
    );
    expect(result.operations.filter((o) => o.id !== note.conferencia)).toEqual(
      s.operations.filter((o) => o.id !== note.conferencia),
    );
  });
  it("salvar novamente sem alterações não reabre uma pendência resolvida nem altera auditoria", () => {
    const s = createDemoState(),
      note = s.notes[1]!;
    s.cases = s.cases.map((c) =>
      c.nf === note.nf && c.conferencia === note.conferencia ? { ...c, status: "resolvida" } : c,
    );
    const result = saveNote(
      s,
      note.id,
      { encontrados: note.encontrados!, status: note.status, observacao: note.observacao },
      "Teste",
      "agora",
      "repetido",
    );
    expect(result).toBe(s);
  });
});
