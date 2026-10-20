import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CountCalculator } from "@/components/count-calculator";
import { OperationProvider } from "@/components/operation-provider";
import { useOperations } from "@/lib/operation-context";
import {
  createDemoState,
  decideDiscovery,
  reportDiscovery,
  saveNote,
  type Discovery,
} from "@/lib/operation-model";
import { productTotal } from "@/lib/product-count";
import { loadWorkspace, persistWorkspace, WORKSPACE_KEY } from "@/lib/local-workspace";
import { readNoteDraft, useNoteDraft } from "@/hooks/use-note-draft";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
describe("Produtos separados de volumes", () => {
  it("soma caixas diferentes e rejeita quantidades inseguras", () => {
    expect(
      productTotal([
        { boxes: 10, units: 24 },
        { boxes: 5, units: 12 },
        { boxes: 1, units: 8 },
      ]),
    ).toBe(308);
    expect(() => productTotal([{ boxes: -1, units: 24 }])).toThrow();
    expect(() => productTotal([{ boxes: 1.5, units: 24 }])).toThrow();
    expect(() => productTotal([{ boxes: Number.MAX_SAFE_INTEGER, units: 2 }])).toThrow();
  });
  it("exige confirmação do cálculo de produtos e não aplica volumes", () => {
    const volumes = vi.fn(),
      products = vi.fn();
    render(<CountCalculator onApply={volumes} onApplyProducts={products} expectedVolumes={50} />);
    fireEvent.click(screen.getByRole("button", { name: "Calculadora" }));
    fireEvent.click(screen.getByRole("button", { name: "Produtos nas caixas" }));
    fireEvent.change(screen.getByLabelText("Caixas 1"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Unid. por caixa 1"), { target: { value: "24" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar caixas diferentes" }));
    fireEvent.change(screen.getByLabelText("Caixas 2"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("Unid. por caixa 2"), { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar caixas diferentes" }));
    fireEvent.change(screen.getByLabelText("Caixas 3"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Unid. por caixa 3"), { target: { value: "8" } });
    fireEvent.change(screen.getByLabelText("Unidades esperadas · opcional"), {
      target: { value: "310" },
    });
    expect(screen.getByText(/Diferença: -2 unidades/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Usar no campo de produtos" }));
    expect(products).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar uso do resultado" }));
    expect(products).toHaveBeenCalledWith({
      lines: [
        { boxes: 10, units: 24 },
        { boxes: 5, units: 12 },
        { boxes: 1, units: 8 },
      ],
      total: 308,
      expected: 310,
    });
    expect(volumes).not.toHaveBeenCalled();
  });
  it("mantém falta física mesmo com produtos iguais ao esperado e preserva auditoria", () => {
    const state = createDemoState();
    const note = state.notes.find((n) => n.nf === "000184539")!;
    const saved = saveNote(
      state,
      note.id,
      {
        encontrados: 9,
        status: "localizacao",
        observacao: "Um volume a localizar",
        produtos: { lines: [{ boxes: 30, units: 24 }], total: 720, expected: 720 },
      },
      "Teste",
      "2026-10-20 10:00",
      "product-event",
    );
    expect(saved.notes.find((n) => n.id === note.id)?.status).toBe("localizacao");
    expect(saved.notes.find((n) => n.id === note.id)?.encontrados).toBe(9);
    expect(saved.cases[0]?.registroOriginal?.produtos?.total).toBe(720);
    expect(saved.history[0]?.descricao).toContain("720 unidades");
  });
});
const report: Discovery = {
  id: "found-1",
  quantity: 1,
  description: "Etiqueta localizada no pallet P-02",
  actor: "Conferente teste",
  at: "2026-10-20 09:30",
  state: "pending",
};
describe("Localização e validação", () => {
  it("informa localização sem alterar contagem ou encerrar e mantém sequência de decisões", () => {
    const state = createDemoState();
    const reported = reportDiscovery(state, "OC-DEMO-311", report);
    expect(reported.notes).toBe(state.notes);
    expect(reported.cases[0]?.status).toBe("nova");
    expect(() => reportDiscovery(reported, "OC-DEMO-311", { ...report, id: "duplicate" })).toThrow(
      "Já existe",
    );
    expect(() =>
      decideDiscovery(reported, "OC-DEMO-311", report.id, true, "", "Adm", report.at, "decision"),
    ).toThrow();
    const validated = decideDiscovery(
      reported,
      "OC-DEMO-311",
      report.id,
      true,
      "Etiqueta e NF verificadas",
      "Adm",
      report.at,
      "decision",
    );
    expect(validated.cases[0]?.status).toBe("nova");
    expect(validated.cases[0]?.discoveries?.[0]?.decision?.actor).toBe("Adm");
    expect(validated.history[1]?.tipo).toBe("localizacao_informada");
    expect(() =>
      decideDiscovery(
        validated,
        "OC-DEMO-311",
        report.id,
        false,
        "Alterar",
        "Adm",
        report.at,
        "again",
      ),
    ).toThrow();
  });
  it("impede encerramento enquanto existe localização aguardando validação", () => {
    const { result } = renderHook(useOperations, { wrapper: OperationProvider });
    act(() => result.current.reportFound("OC-DEMO-311", 1, "Pallet de teste", []));
    expect(() =>
      act(() =>
        result.current.updateCase("OC-DEMO-311", {
          status: "resolvida",
          justificativa: "Encontrado",
        }),
      ),
    ).toThrow("Valide");
    expect(result.current.state.cases[0]?.status).toBe("nova");
  });
});
describe("Persistência local explícita", () => {
  it("recupera contagens após remontar sem confundir operações", () => {
    const first = renderHook(useOperations, { wrapper: OperationProvider });
    const id = first.result.current.state.notes.find((n) => n.nf === "000184539")!.id;
    act(() =>
      first.result.current.record(id, {
        encontrados: 9,
        status: "localizacao",
        observacao: "Pallet de teste",
      }),
    );
    first.unmount();
    const second = renderHook(useOperations, { wrapper: OperationProvider });
    expect(second.result.current.state.notes.find((n) => n.id === id)?.encontrados).toBe(9);
    expect(second.result.current.state.cases[0]?.registroOriginal?.encontrados).toBe(9);
  });
  it("não substitui dados ilegíveis nem alterações de outra aba", () => {
    localStorage.setItem(WORKSPACE_KEY, "corrompido");
    expect(() => loadWorkspace()).toThrow();
    expect(localStorage.getItem(WORKSPACE_KEY)).toBe("corrompido");
    expect(() => persistWorkspace(createDemoState(), null)).toThrow("Outra aba");
  });
  it("falha de gravação não altera o registro apresentado como salvo", () => {
    const { result } = renderHook(useOperations, { wrapper: OperationProvider });
    const before = result.current.state;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota", "QuotaExceededError");
    });
    expect(() =>
      act(() =>
        result.current.record("note-6", {
          encontrados: 9,
          status: "localizacao",
          observacao: "Teste",
        }),
      ),
    ).toThrow("não foi salvo");
    expect(result.current.state).toBe(before);
  });
  it("salva rascunho automaticamente e conserva a separação de produtos", () => {
    vi.useFakeTimers();
    const value = {
      quantity: "9",
      status: "localizacao" as const,
      observation: "Recontar",
      calculation: "",
      divergence: true,
      photos: [],
      products: { lines: [{ boxes: 30, units: 24 }], total: 720 },
    };
    const { result } = renderHook(() => useNoteDraft("note-draft", value, true));
    act(() => vi.advanceTimersByTime(350));
    expect(result.current).toContain("Rascunho salvo neste aparelho");
    expect(readNoteDraft("note-draft")?.products?.total).toBe(720);
    expect(readNoteDraft("note-draft")?.quantity).toBe("9");
  });
});
