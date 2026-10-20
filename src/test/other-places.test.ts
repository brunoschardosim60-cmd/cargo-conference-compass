import { beforeEach, describe, expect, it } from "vitest";
import { createDemoState, type Evidence } from "@/lib/operation-model";
import { emptyOtherPlace, otherPlaceInput, saveOtherPlace } from "@/lib/other-places";
import { loadWorkspace, WORKSPACE_KEY } from "@/lib/local-workspace";
import { historyMatches } from "@/lib/history-search";
import { operationMatches, arrivalDay } from "@/lib/operation-search";

const input = () => ({
  ...emptyOtherPlace(),
  nf: "987654",
  identificacao: "ETQ-POA-01",
  cliente: "Cliente de teste",
  destino: "Itajaí",
  responsavel: "Conferente teste",
  identificadoEm: "2026-10-20T08:30",
});
const photo: Evidence = {
  id: "foto-1",
  name: "etiqueta.jpg",
  createdAt: "2026-10-20T08:30",
  data: "data:image/jpeg;base64,dGVzdGU=",
};
describe("Volumes de outras praças", () => {
  beforeEach(() => localStorage.clear());
  it("preserva faltas locais e fotos na linha do tempo após identificação, envio e recebimento", () => {
    const original = createDemoState();
    const first = saveOtherPlace(
      original,
      "EX-T1",
      { ...input(), photos: [photo] },
      "Conferente",
      "2026-10-20 08:30",
      "h1",
    );
    const sent = saveOtherPlace(
      first,
      "EX-T1",
      { ...input(), status: "encaminhado", carreta: "TEST123", enviadoEm: "2026-10-20T10:00" },
      "Administrativo",
      "2026-10-20 10:00",
      "h2",
    );
    const received = saveOtherPlace(
      sent,
      "EX-T1",
      {
        ...otherPlaceInput(sent.otherPlaces[0]!),
        status: "recebido",
        recebidoEm: "2026-10-21T10:00",
        confirmacao: "Responsável confirmou por telefone",
      },
      "Administrativo",
      "2026-10-21 10:15",
      "h3",
    );
    expect(original.otherPlaces.some((p) => p.id === "EX-T1")).toBe(false);
    expect(received.notes).toBe(original.notes);
    expect(received.cases).toBe(original.cases);
    expect(received.otherPlaces[0]?.version).toBe(3);
    expect(received.history.find((e) => e.id === "h1")?.photos).toEqual([photo]);
    expect(received.history.slice(0, 3).map((e) => e.usuario)).toEqual([
      "Administrativo",
      "Administrativo",
      "Conferente",
    ]);
    expect(received.history.find((e) => e.id === "h2")?.descricao).toContain(
      "identificado → encaminhado",
    );
    expect(
      saveOtherPlace(
        received,
        "EX-T1",
        otherPlaceInput(received.otherPlaces[0]!),
        "Administrativo",
        "2026-10-21 10:15",
        "h4",
      ),
    ).toBe(received);
  });
  it("impede envio incompleto, recebimento sem confirmação e datas impossíveis ou fora de ordem", () => {
    const save = (patch: Partial<ReturnType<typeof input>>) =>
      saveOtherPlace(
        createDemoState(),
        "EX-T1",
        { ...input(), ...patch },
        "Teste",
        "agora",
        "evento",
      );
    expect(() => save({ nf: "", identificacao: "" })).toThrow(/NF ou identificação/);
    expect(() => save({ volumes: 1.5 })).toThrow(/inteira/);
    expect(() => save({ identificadoEm: "2026-02-30T08:30" })).toThrow(/data/);
    expect(() => save({ status: "encaminhado" })).toThrow(/carreta/);
    expect(() =>
      save({ status: "encaminhado", carreta: "TEST123", enviadoEm: "2026-10-19T10:00" }),
    ).toThrow(/anterior/);
    expect(() =>
      save({
        status: "recebido",
        carreta: "TEST123",
        enviadoEm: "2026-10-20T10:00",
        recebidoEm: "2026-10-21T10:00",
      }),
    ).toThrow(/evidência/);
    expect(() =>
      save({
        status: "recebido",
        carreta: "TEST123",
        enviadoEm: "2026-10-20T10:00",
        recebidoEm: "2026-10-20T09:00",
        confirmacao: "Contato",
      }),
    ).toThrow(/anterior/);
  });
  it("não apaga envio ou confirmação pela troca de status", () => {
    const sent = saveOtherPlace(
      createDemoState(),
      "EX-T1",
      { ...input(), status: "encaminhado", carreta: "TEST123", enviadoEm: "2026-10-20T10:00" },
      "Teste",
      "agora",
      "h1",
    );
    expect(() => saveOtherPlace(sent, "EX-T1", input(), "Teste", "agora", "h2")).toThrow(/apagado/);
    const received = saveOtherPlace(
      sent,
      "EX-T1",
      {
        ...otherPlaceInput(sent.otherPlaces[0]!),
        status: "recebido",
        recebidoEm: "2026-10-21T10:00",
        confirmacao: "Contato",
      },
      "Teste",
      "depois",
      "h2",
    );
    expect(() =>
      saveOtherPlace(
        received,
        "EX-T1",
        { ...otherPlaceInput(received.otherPlaces[0]!), status: "encaminhado" },
        "Teste",
        "depois",
        "h3",
      ),
    ).toThrow(/removido/);
  });
  it("carrega dados antigos sem sobrescrever o armazenamento e mantém contagens", () => {
    const { otherPlaces: _otherPlaces, ...legacy } = createDemoState();
    legacy.notes[0]!.observacao = "Anotação preservada";
    const raw = JSON.stringify(legacy);
    localStorage.setItem(WORKSPACE_KEY, raw);
    const loaded = loadWorkspace();
    expect(loaded.state?.notes).toEqual(legacy.notes);
    expect(loaded.state?.cases).toEqual(legacy.cases);
    expect(loaded.state?.otherPlaces.length).toBeGreaterThan(0);
    expect(localStorage.getItem(WORKSPACE_KEY)).toBe(raw);
  });
  it("pesquisa histórico por cliente, NF, destino sem acento, identificação e data", () => {
    const state = saveOtherPlace(
      createDemoState(),
      "EX-T1",
      input(),
      "Teste",
      "2026-10-20 08:30",
      "h1",
    );
    const event = state.history[0]!;
    for (const query of ["987654", "itajaI", "cliente de teste", "ETQ-POA-01"])
      expect(historyMatches(state, event, query, "2026-10-20")).toBe(true);
    expect(historyMatches(state, event, "987654", "2026-10-19")).toBe(false);
    expect(historyMatches(state, event, "987654", "", "Outro usuário")).toBe(false);
  });
  it("encontra a operação pela NF sem misturar outra operação", () => {
    const state = createDemoState();
    const note = state.notes.find((n) => n.nf === "000184539")!;
    const op = state.operations.find((o) => o.id === note.conferencia)!;
    expect(operationMatches(state, op, note.nf)).toBe(true);
    expect(operationMatches(state, op, op.motorista)).toBe(true);
    expect(
      operationMatches(
        state,
        state.operations.find((o) => o.id === "CF-DEMO-0140")!,
        note.nf,
      ),
    ).toBe(false);
  });
  it("filtra chegada de amostras e operações novas sem inventar ano para registros sem data", () => {
    const operation = createDemoState().operations[0]!;
    expect(arrivalDay(operation)).toBe("2026-10-19");
    expect(arrivalDay({ ...operation, id: "nova", chegada: "2026-10-20 08:00" })).toBe(
      "2026-10-20",
    );
    expect(arrivalDay({ ...operation, id: "nova", chegada: "Não informada" })).toBe("");
    expect(arrivalDay({ ...operation, id: "nova", chegada: "19/10 08:00" })).toBe("");
  });
});
