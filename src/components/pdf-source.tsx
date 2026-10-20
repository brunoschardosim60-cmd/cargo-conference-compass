import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { originalPdf } from "@/lib/pdf-documents";
import type { PdfSource as Source } from "@/lib/pdf-import";
import { Btn } from "./ui-kit";
export function PdfSource({ source }: { source: Source }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="pdf-source">
      <span>
        <strong>Relação original</strong>
        <small>
          {source.name} · {source.pages} páginas · revisada antes da importação
        </small>
      </span>
      <Btn
        variant="outline"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const file = await originalPdf(source.sha256);
            const url = URL.createObjectURL(file);
            const a = document.createElement("a");
            a.href = url;
            a.download = source.name;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
          } catch (e) {
            toast.error((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Download size={16} />
        {busy ? "Abrindo…" : "Baixar PDF original"}
      </Btn>
    </div>
  );
}
