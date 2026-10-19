import { act, renderHook } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { OperationProvider } from "@/components/operation-provider";
import { useOperations } from "@/lib/operation-context";

describe("Fluxo integrado de demonstração", () => {
  beforeEach(() => {
    let id = 0;
    vi.stubGlobal("crypto", { randomUUID: () => "test-uuid-" + ++id });
  });
  afterEach(() => vi.unstubAllGlobals());
  it("registra os valores efetivos após edição parcial e ignora salvamento repetido", () => {
    const { result } = renderHook(useOperations, { wrapper: OperationProvider });
    act(() =>
      result.current.updateCase("OC-DEMO-311", {
        responsavel: "Ana P.",
        providencia: "Consulta realizada",
        codigoOficial: "REF-TESTE",
      }),
    );
    act(() => result.current.updateCase("OC-DEMO-311", { status: "analise" }));
    expect(result.current.state.history[0]?.descricao).toContain("Nova: Consulta realizada");
    expect(result.current.state.history[0]?.descricao).toContain(
      "Referência oficial informada manualmente: REF-TESTE",
    );
    const state = result.current.state;
    act(() => result.current.updateCase("OC-DEMO-311", { status: "analise" }));
    expect(result.current.state).toBe(state);
  });
  it("não reinicia operação concluída nem registra transição sem mudança", () => {
    const { result } = renderHook(useOperations, { wrapper: OperationProvider });
    const initial = result.current.state;
    act(() => result.current.changeOperation("CF-DEMO-0141", "aguardando"));
    act(() => result.current.changeOperation("CF-DEMO-0142", "em_andamento"));
    expect(result.current.state).toBe(initial);
  });
  it("cria operação, inicia, salva, pausa, retoma e finaliza sem perder a contagem", () => {
    const { result } = renderHook(useOperations, { wrapper: OperationProvider });
    let id = "";
    act(() => {
      id = result.current.addOperation(
        {
          origem: "Itajaí/SC",
          placa: "TEST123",
          motorista: "Teste",
          doca: "D01",
          responsavel: "Conferente teste",
        },
        [
          {
            nf: "123",
            pedido: "P1",
            destinatario: "Cliente teste",
            previstos: 50,
            praca: "POA",
            pallet: "P1",
          },
        ],
      );
    });
    act(() => result.current.changeOperation(id, "concluida"));
    expect(result.current.state.operations.find((o) => o.id === id)?.status).toBe("aguardando");
    act(() => result.current.changeOperation(id, "em_andamento"));
    const note = result.current.state.notes.find((n) => n.conferencia === id)!;
    act(() =>
      result.current.record(note.id, {
        encontrados: 49,
        status: "localizacao",
        observacao: "Procurar um volume",
      }),
    );
    act(() => result.current.changeOperation(id, "pausada"));
    expect(result.current.state.notes.find((n) => n.id === note.id)?.encontrados).toBe(49);
    act(() => result.current.changeOperation(id, "em_andamento"));
    act(() => result.current.changeOperation(id, "concluida"));
    expect(result.current.state.operations.find((o) => o.id === id)?.concluidaEm).toBeTruthy();
    expect(result.current.state.cases.find((c) => c.conferencia === id)?.status).toBe("nova");
    act(() => result.current.changeOperation(id, "em_andamento"));
    expect(result.current.state.operations.find((o) => o.id === id)?.status).toBe("concluida");
  });
  it("não resolve pendência sem justificativa e mantém referência oficial como informação manual", () => {
    const { result } = renderHook(useOperations, { wrapper: OperationProvider });
    act(() => result.current.updateCase("OC-DEMO-311", { status: "resolvida" }));
    expect(result.current.state.cases.find((c) => c.id === "OC-DEMO-311")?.status).toBe("nova");
    act(() =>
      result.current.updateCase("OC-DEMO-311", {
        status: "resolvida",
        justificativa: "Recebimento conferido",
        codigoOficial: "REF-TESTE",
        providencia: "Volume localizado",
      }),
    );
    expect(result.current.state.cases.find((c) => c.id === "OC-DEMO-311")?.status).toBe(
      "resolvida",
    );
    expect(result.current.state.history[0]?.descricao).toContain(
      "Referência oficial informada manualmente: REF-TESTE",
    );
  });
});
