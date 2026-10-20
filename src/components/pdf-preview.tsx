import { useEffect, useRef, useState } from "react";
import { pdfAssetOptions } from "@/lib/pdf-assets";
import { Btn } from "./ui-kit";
export function PdfPreview({ file, page }: { file: File; page: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let dispose = () => {};
    setBusy(true);
    setError("");
    void (async () => {
      const pdfjs = await import("pdfjs-dist");
      const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
      if (cancelled) return;
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      const task = pdfjs.getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
        ...pdfAssetOptions(pdfjs.version),
      });
      dispose = () => {
        void task.destroy();
      };
      if (cancelled) {
        dispose();
        return;
      }
      try {
        const pdf = await task.promise;
        const source = await pdf.getPage(page);
        if (cancelled || !canvas.current) return;
        const target = canvas.current,
          context = target.getContext("2d");
        if (!context) throw new Error("Visualização indisponível neste navegador.");
        const viewport = source.getViewport({ scale: zoomed ? 3 : 1.5 });
        target.width = viewport.width;
        target.height = viewport.height;
        await source.render({ canvas: target, canvasContext: context, viewport }).promise;
        if (!cancelled) setBusy(false);
      } finally {
        dispose();
      }
    })().catch((e) => {
      if (!cancelled) {
        setError((e as Error).message);
        setBusy(false);
      }
    });
    return () => {
      cancelled = true;
      dispose();
    };
  }, [file, page, zoomed]);
  return (
    <div className={`pdf-preview ${zoomed ? "zoomed" : ""}`}>
      <Btn variant="outline" onClick={() => setZoomed((v) => !v)}>
        {zoomed ? "Ajustar à largura" : "Ampliar página"}
      </Btn>
      {busy && <p role="status">Abrindo página {page}…</p>}
      {error && (
        <p role="alert">
          Não foi possível exibir a página. O arquivo selecionado continua preservado; consulte-o em
          seu leitor de PDF. {error}
        </p>
      )}
      <div className="pdf-canvas-viewport">
        <canvas ref={canvas} aria-label={`Página ${page} do PDF original`} role="img" />
      </div>
    </div>
  );
}
