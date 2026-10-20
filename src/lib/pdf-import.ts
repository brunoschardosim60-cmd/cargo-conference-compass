import { searchText } from "./operation-search";

export type PdfText = { text: string; x: number; y: number; width: number };
export type PdfPageText = { page: number; width: number; items: PdfText[] };
export type ImportRow = {
  nf: string;
  documento: string;
  remetente: string;
  destinatario: string;
  praca: string;
  previstos: number | null;
  peso: number | null;
  pedido: string;
  pallet: string;
  sourcePage: number;
  sourceLine: number;
  issues: string[];
};
export type PdfExtraction = {
  rows: ImportRow[];
  pages: number;
  detailPages: number[];
  declaredRows: number | null;
  declaredVolumes: number | null;
  plates: string[];
  driver: string;
  warnings: string[];
};
export type PdfSource = {
  sha256: string;
  name: string;
  size: number;
  pages: number;
  parser: "damdfe-details-v1";
  reviewedAt: string;
  declaredRows: number | null;
  declaredVolumes: number | null;
  extractedRows: number;
  reviewReason: string;
};
export function pdfLines(page: PdfPageText) {
  const lines: { y: number; items: PdfText[]; text: string }[] = [];
  for (const item of [...page.items]
    .filter((i) => i.text.trim())
    .sort((a, b) => a.y - b.y || a.x - b.x)) {
    let line = lines.find((l) => Math.abs(l.y - item.y) < 1.5);
    if (!line) {
      line = { y: item.y, items: [], text: "" };
      lines.push(line);
    }
    line.items.push(item);
  }
  return lines.map((l) => ({
    ...l,
    items: l.items.sort((a, b) => a.x - b.x),
    text: l.items
      .sort((a, b) => a.x - b.x)
      .map((i) => i.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim(),
  }));
}
const numeric = (s: string) =>
  /^\d{1,3}(\.\d{3})*(,\d+)?$|^\d+(,\d+)?$/.test(s.trim())
    ? Number(s.replaceAll(".", "").replace(",", "."))
    : null;
export function rowIssues(row: Pick<ImportRow, "nf" | "destinatario" | "previstos">) {
  return [
    !/^\d{1,9}$/.test(row.nf.trim()) ? "Revise o número da NF" : "",
    !row.destinatario.trim() ? "Informe o destinatário" : "",
    row.previstos === null || !Number.isSafeInteger(row.previstos) || row.previstos <= 0
      ? "Revise os volumes físicos"
      : "",
  ].filter(Boolean);
}
export function extractCargo(pages: PdfPageText[]): PdfExtraction {
  const result: PdfExtraction = {
    rows: [],
    pages: pages.length,
    detailPages: [],
    declaredRows: null,
    declaredVolumes: null,
    plates: [],
    driver: "",
    warnings: [],
  };
  for (const page of pages) {
    const lines = pdfLines(page);
    if (!lines.length)
      result.warnings.push(
        `Página ${page.page} sem texto: confira se há mercadoria em imagem não lida.`,
      );
    if (
      lines.some((l) => searchText(l.text) === "detalhes") &&
      !lines.some(
        (l) =>
          searchText(l.text).includes("remetente") && searchText(l.text).includes("destinatario"),
      )
    )
      result.warnings.push(
        `Página ${page.page}: detalhes em formato não reconhecido; confira no original.`,
      );
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index]!;
      const normal = searchText(line.text);
      if (normal.includes("placa") && normal.includes("renavam") && normal.includes("nome")) {
        const name = line.items.find((i) => searchText(i.text) === "nome");
        const plate = line.items.find((i) => searchText(i.text) === "placa");
        const values = lines.filter((l) => l.y > line.y + 2 && l.y < line.y + 28);
        for (const value of values) {
          const detected = value.items.find(
            (i) =>
              plate &&
              Math.abs(i.x - plate.x) < 30 &&
              /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(i.text.trim()),
          );
          if (detected && !result.plates.includes(detected.text.trim()))
            result.plates.push(detected.text.trim());
          if (name && !result.driver)
            result.driver = value.items
              .filter((i) => i.x >= name.x - 3)
              .map((i) => i.text)
              .join(" ")
              .trim();
        }
      }
      const total = line.text.match(/Totais\s+Entregas:\s*(\d+)\s+([\d.]+)/i);
      if (total) {
        result.declaredRows = Number(total[1]);
        result.declaredVolumes = numeric(total[2]!);
      }
      // Recognize the actual detailed table, never CT-e lists or fiscal summary counts.
      if (!(
        normal.includes("remetente") &&
        normal.includes("destinatario") &&
        normal.includes("destino") &&
        normal.includes("peso")
      ))
        continue;
      const head = (word: string) =>
        line.items.find((i) => searchText(i.text).replace(/[.:]/g, "") === word);
      const doc = head("doc"),
        nf = head("nf"),
        sender = head("remetente"),
        receiver = head("destinatario"),
        destination = head("destino"),
        address = head("endereco"),
        volume = head("vol"),
        weight = head("peso");
      if (!doc || !nf || !sender || !receiver || !destination || !address || !volume || !weight) {
        result.warnings.push(`Página ${page.page}: cabeçalho incompleto; revise o original.`);
        continue;
      }
      result.detailPages.push(page.page);
      const columns = [
        doc.x - 3,
        nf.x - 8,
        sender.x - 2,
        receiver.x - 2,
        destination.x - 2,
        address.x - 2,
        volume.x - 8,
        weight.x - 8,
      ];
      for (const data of lines.slice(index + 1)) {
        if (/^Totais|^\(\*\)/i.test(data.text)) break;
        const cell = (n: number) =>
          data.items
            .filter((i) => i.x >= columns[n]! && i.x < (columns[n + 1] ?? page.width))
            .map((i) => i.text)
            .join(" ")
            .trim();
        if (!/^\d+-\d+/.test(cell(0))) {
          if (data.text && data.y > line.y && !/^\(\*\)/.test(data.text))
            result.warnings.push(
              `Página ${page.page}, linha não reconhecida: confira no original antes de confirmar.`,
            );
          continue;
        }
        const row: ImportRow = {
          documento: cell(0),
          nf: cell(1).replace(/^\*\s*/, ""),
          remetente: cell(2),
          destinatario: cell(3),
          praca: cell(4),
          previstos: numeric(cell(6)),
          peso: numeric(cell(7).split(/\s+/)[0] || ""),
          pedido: "",
          pallet: "",
          sourcePage: page.page,
          sourceLine: result.rows.filter((r) => r.sourcePage === page.page).length + 1,
          issues: [],
        };
        row.issues = rowIssues(row);
        result.rows.push(row);
      }
    }
  }
  result.plates = [...new Set(result.plates)];
  if (!result.rows.length)
    throw new Error(
      "Não encontrei uma tabela de notas e volumes no formato DAMDFE detalhado. PDFs digitalizados e outros formatos ainda precisam de transcrição manual; nenhum dado foi criado.",
    );
  if (result.declaredRows === null || result.declaredVolumes === null)
    result.warnings.push(
      "Total de entregas ou volumes não identificado. Confira a integralidade da relação no original.",
    );
  const seen = new Set<string>();
  for (const row of result.rows) {
    const key = `${row.documento}|${row.nf}`;
    if (seen.has(key))
      row.issues.push(
        "Documento e NF repetidos: confirme se é outra linha ou uma página duplicada",
      );
    seen.add(key);
  }
  if (result.declaredRows !== null && result.declaredRows !== result.rows.length)
    result.warnings.push(
      `O PDF informa ${result.declaredRows} entregas, mas foram lidas ${result.rows.length} linhas.`,
    );
  if (
    result.declaredVolumes !== null &&
    result.declaredVolumes !== result.rows.reduce((n, r) => n + (r.previstos || 0), 0)
  )
    result.warnings.push("A soma dos volumes lidos não corresponde ao total impresso.");
  return result;
}
