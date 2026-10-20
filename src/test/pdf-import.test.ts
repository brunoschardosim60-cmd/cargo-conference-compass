import { describe, expect, it } from "vitest";
import { extractCargo, type PdfPageText, type PdfSource, rowIssues } from "@/lib/pdf-import";
import { createReceiving } from "@/lib/receiving-create";
import { createDemoState } from "@/lib/operation-model";
import { clientGroups } from "@/lib/client-groups";
import { loadWorkspace, persistWorkspace } from "@/lib/local-workspace";
import { readCargoPdf } from "@/lib/pdf-reader";
const text = (value: string, x: number, y: number) => ({ text: value, x, y, width: 20 });
const header = [
  "Doc",
  "NF",
  "Remetente",
  "Destinatário",
  "Destino",
  "Endereço",
  "Vol.",
  "Peso",
  "Val. NF",
].map((s, i) => text(s, [26, 66, 104, 254, 404, 508, 701, 738, 785][i]!, 100));
const row = (nf: string, vol: string, y: number, doc = "100-1") => [
  text(doc, 26, y),
  text(nf, 66, y),
  text("Remetente teste", 104, y),
  text("Cliente teste", 254, y),
  text("DESTINO-RS", 404, y),
  text("Rua Teste, 100", 508, y),
  text(vol, 704, y),
  text("1.200,50", 734, y),
  text("999,99", 785, y),
];
const page = (number: number, nf: string, volume: string, total = false): PdfPageText => ({
  page: number,
  width: 842,
  items: [
    ...header,
    ...row(nf, volume, 110),
    ...(total ? [text("Totais Entregas: 2 51 2.401,00 1.999,98", 26, 130)] : []),
  ],
});
export const source: PdfSource = {
  sha256: "a".repeat(64),
  name: "relacao-teste.pdf",
  size: 1000,
  pages: 4,
  parser: "damdfe-details-v1",
  reviewedAt: "2026-10-20T10:00:00Z",
  declaredRows: 2,
  declaredVolumes: 51,
  extractedRows: 2,
  reviewReason: "",
};
describe("Leitura e importação da relação", () => {
  it("usa apenas a tabela de detalhes em múltiplas páginas, mantendo origem das linhas e grandezas", () => {
    const result = extractCargo([
      { page: 1, width: 842, items: [text("Qtd. CT-e 36 Peso Total 4.440,46", 20, 100)] },
      page(3, "000001", "50"),
      page(4, "000002", "1", true),
    ]);
    expect(result.rows.map((r) => [r.nf, r.previstos, r.sourcePage])).toEqual([
      ["000001", 50, 3],
      ["000002", 1, 4],
    ]);
    expect(result.rows[0]?.peso).toBe(1200.5);
    expect(result.rows.every((r) => r.pedido === "" && r.pallet === "")).toBe(true);
    expect(result.declaredVolumes).toBe(51);
    expect(result.warnings).toEqual([]);
  });
  it("sinaliza valores ambíguos, total divergente e páginas repetidas sem inventar números", () => {
    const result = extractCargo([page(3, "000001", "?"), page(4, "000001", "1", true)]);
    expect(result.rows[0]?.previstos).toBeNull();
    expect(rowIssues(result.rows[0]!)).toContain("Revise os volumes físicos");
    expect(result.rows[1]?.issues.join()).toContain("repetidos");
    expect(result.warnings.join()).toContain("soma dos volumes");
  });
  it("rejeita somente imagem, CT-e e formato desconhecido em vez de criar notas fictícias", () => {
    expect(() => extractCargo([{ page: 1, width: 842, items: [] }])).toThrow(/Não encontrei/);
    expect(() =>
      extractCargo([{ page: 1, width: 842, items: [text("CT-e 10001234 50", 20, 100)] }]),
    ).toThrow(/Não encontrei/);
  });
  it("impede quantidade inválida e NF repetida no mesmo documento antes de gravar", () => {
    const state = createDemoState(),
      rows = extractCargo([page(3, "000001", "50"), page(4, "000002", "1", true)]).rows.map(
        (r) => ({ ...r, previstos: r.previstos! }),
      );
    const data = {
      origem: "Origem teste",
      placa: "TEST123",
      motorista: "Motorista teste",
      doca: "",
      responsavel: "",
    };
    const ids = { operation: "OP-TEST", event: "EV-TEST", notes: ["N1", "N2"] };
    expect(() =>
      createReceiving(
        state,
        data,
        [{ ...rows[0]!, previstos: -1 }, rows[1]!],
        ids,
        "Teste",
        "agora",
        source,
      ),
    ).toThrow(/Revise/);
    expect(() =>
      createReceiving(state, data, [rows[0]!, rows[0]!], ids, "Teste", "agora", source),
    ).toThrow(/repetidos/);
  });
  it("preserva dados anteriores, impede reimportação por hash e não marca notas como conferidas", () => {
    localStorage.clear();
    const state = createDemoState(),
      rows = extractCargo([page(3, "000001", "50"), page(4, "000002", "1", true)]).rows.map(
        (r) => ({ ...r, previstos: r.previstos! }),
      );
    const data = {
      origem: "Origem teste",
      placa: "TEST123",
      motorista: "Motorista teste",
      doca: "",
      responsavel: "",
    };
    const ids = { operation: "OP-TEST", event: "EV-TEST", notes: ["N1", "N2"] };
    const result = createReceiving(state, data, rows, ids, "Teste", "agora", source);
    expect(result.cases).toBe(state.cases);
    expect(result.notes.slice(0, state.notes.length)).toEqual(state.notes);
    expect(
      result.notes.slice(-2).every((n) => n.status === "pendente" && n.encontrados === null),
    ).toBe(true);
    expect(result.operations[0]?.chegada).toBe("Não informada");
    expect(result.history[0]?.descricao).toContain(source.sha256);
    expect(() =>
      createReceiving(
        result,
        data,
        rows,
        { ...ids, operation: "OP-OUTRA" },
        "Teste",
        "depois",
        source,
      ),
    ).toThrow(/já foi importado/);
    persistWorkspace(result, null);
    expect(loadWorkspace().state?.operations[0]?.source).toEqual(source);
    localStorage.clear();
  });
  it("mantém o mesmo cliente separado por destino, dentro da operação", () => {
    const sample = createDemoState().notes[0]!;
    const groups = clientGroups(
      [
        { ...sample, id: "n1", conferencia: "OP", destinatario: "Cliente", praca: "CANOAS-RS" },
        { ...sample, id: "n2", conferencia: "OP", destinatario: "Cliente", praca: "GRAVATAI-RS" },
        { ...sample, id: "n3", conferencia: "OUTRA", destinatario: "Cliente", praca: "CANOAS-RS" },
      ],
      "OP",
    );
    expect(groups.map((g) => g.name)).toEqual(["Cliente · CANOAS-RS", "Cliente · GRAVATAI-RS"]);
    expect(groups.every((g) => g.rows.length === 1)).toBe(true);
  });
  it("valida extensão, tamanho e assinatura do conteúdo antes de abrir o leitor", async () => {
    const invalid = {
      name: "relacao.pdf",
      type: "application/pdf",
      size: 10,
      arrayBuffer: async () => new TextEncoder().encode("not a PDF").buffer,
    } as File;
    await expect(
      readCargoPdf({ ...invalid, name: "planilha.xls" } as File, () => {}),
    ).rejects.toThrow(/arquivo PDF/);
    await expect(
      readCargoPdf({ ...invalid, size: 21 * 1024 * 1024 } as File, () => {}),
    ).rejects.toThrow(/20 MB/);
    await expect(readCargoPdf(invalid, () => {})).rejects.toThrow(/conteúdo/);
  });
});
