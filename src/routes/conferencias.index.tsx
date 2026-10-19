import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Upload, FileUp, X } from "lucide-react";
import { PageHeader, Panel, DataTable, SearchBox, FilterSelect, Btn, NotConnected, Mono, EmptyState } from "@/components/ui-kit";
import { StatusPill, confMap } from "@/components/status";
import { conferencias } from "@/lib/demo-data";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/conferencias/")({
  head: () => meta("Conferências", "Consulta e abertura de conferências de cargas recebidas."),
  component: Page,
});

function Page() {
  const [q, setQ] = useState("");
  const [st, setSt] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const rows = conferencias.filter(
    (c) => (!st || c.status === st) && [c.id, c.placa, c.motorista, c.origem].join(" ").toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        title="Conferências"
        subtitle="Cada carreta é uma conferência separada — as notas de operações diferentes nunca se misturam."
        actions={<>
          <Btn variant="outline" onClick={() => setImportOpen(true)}><Upload className="size-4" />Importar PDF</Btn>
          <Btn onClick={() => setImportOpen(true)}><Plus className="size-4" />Nova conferência</Btn>
        </>}
      />

      {importOpen && (
        <Panel title="Nova conferência · importar relação de carga" actions={<button onClick={() => setImportOpen(false)} aria-label="Fechar"><X className="size-4" /></button>}>
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-input bg-muted/40 px-6 py-10 text-center hover:bg-muted">
              <FileUp className="size-7 text-muted-foreground" />
              <span className="mt-2 text-sm font-medium">Arraste o PDF da relação ou clique para selecionar</span>
              <span className="mt-1 text-xs text-muted-foreground">Aceita PDFs com várias páginas</span>
              <input type="file" accept="application/pdf" className="hidden" />
            </label>
            <ol className="space-y-3 text-sm">
              {["Enviar o PDF da relação de carga", "Revisar NFs, volumes, pesos e destinos extraídos", "Corrigir ou remover linhas com erro de leitura", "Confirmar e liberar a conferência para o pavilhão"].map((s, i) => (
                <li key={s} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">{i + 1}</span><span className="pt-0.5">{s}</span></li>
              ))}
              <NotConnected>Leitura automática do PDF e gravação ainda não conectadas.</NotConnected>
            </ol>
          </div>
        </Panel>
      )}

      <div className="flex flex-wrap gap-2">
        <SearchBox placeholder="Buscar por operação, placa, motorista ou origem" value={q} onChange={setQ} />
        <FilterSelect label="Situação" value={st} onChange={setSt} options={Object.entries(confMap).map(([k, v]) => [k, v[0]])} />
      </div>

      <Panel flush>
        {rows.length === 0 ? <EmptyState title="Nenhuma conferência encontrada" text="Ajuste a busca ou os filtros." /> : (
          <DataTable head={["Operação", "Origem", "Chegada", "Motorista / Placa", "Doca", "Responsável", "NFs", "Volumes", "Progresso", "Situação"]}>
            {rows.map((c) => {
              const pct = Math.round((c.conferidos / c.volumes) * 100);
              return (
                <tr key={c.id}>
                  <td><Link to="/conferencias/$id" params={{ id: c.id }} className="font-medium text-info hover:underline"><Mono>{c.id}</Mono></Link></td>
                  <td>{c.origem}</td>
                  <td className="tabular whitespace-nowrap">{c.chegada}</td>
                  <td>{c.motorista}<div className="font-mono text-xs text-muted-foreground">{c.placa}</div></td>
                  <td>{c.doca ?? <span className="text-muted-foreground">—</span>}</td>
                  <td>{c.responsavel}</td>
                  <td className="tabular">{c.notas}</td>
                  <td className="tabular">{c.volumes}</td>
                  <td className="min-w-32">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
                      <span className="w-9 text-right text-xs tabular text-muted-foreground">{pct}%</span>
                    </div>
                  </td>
                  <td><StatusPill map={confMap} value={c.status} /></td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}
