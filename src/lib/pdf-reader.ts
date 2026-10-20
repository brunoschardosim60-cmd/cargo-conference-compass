import { extractCargo, type PdfPageText } from "./pdf-import";
import { createClientOnlyFn } from "@tanstack/react-start";
import { pdfAssetOptions } from "./pdf-assets";

export const readCargoPdf = createClientOnlyFn(async function (
  file: File,
  onProgress: (current: number, total: number) => void,
) {
  if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== "application/pdf"))
    throw new Error("Selecione um arquivo PDF.");
  if (!file.size || file.size > 20 * 1024 * 1024) throw new Error("Use um PDF de até 20 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-")
    throw new Error("O conteúdo do arquivo não é um PDF válido.");
  const sha256 = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)))
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const task = pdfjs.getDocument({ data: bytes, ...pdfAssetOptions(pdfjs.version) });
  try {
    const document = await task.promise;
    if (document.numPages > 100)
      throw new Error(
        "Este leitor aceita até 100 páginas por documento. Divida a relação sem repetir páginas.",
      );
    const pages: PdfPageText[] = [];
    for (let n = 1; n <= document.numPages; n++) {
      onProgress(n, document.numPages);
      const page = await document.getPage(n);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      pages.push({
        page: n,
        width: viewport.width,
        items: content.items.flatMap((item) => {
          if (!("str" in item) || !item.str.trim()) return [];
          const point = viewport.convertToViewportPoint(item.transform[4]!, item.transform[5]!);
          return [{ text: item.str, x: point[0]!, y: point[1]!, width: item.width }];
        }),
      });
      page.cleanup();
    }
    return { extraction: extractCargo(pages), sha256 };
  } catch (e) {
    if (e instanceof Error && e.name === "PasswordException")
      throw new Error("O PDF está protegido por senha. Use uma cópia autorizada sem senha.");
    throw e;
  } finally {
    await task.destroy();
  }
});
