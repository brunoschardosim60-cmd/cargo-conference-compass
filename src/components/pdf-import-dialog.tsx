import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FileUp, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useOperations } from "@/lib/operation-context";
import { rowIssues, type ImportRow, type PdfExtraction } from "@/lib/pdf-import";
import { preservePdf } from "@/lib/pdf-documents";
import { readCargoPdf } from "@/lib/pdf-reader";
import { Btn, SearchBox } from "./ui-kit";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { PdfPreview } from "./pdf-preview";

export function PdfImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const guard = useRef({ busy: false, dirty: false });
  const [discard, setDiscard] = useState(false);
  function close() {
    if (guard.current.busy) return;
    if (guard.current.dirty) setDiscard(true);
    else onOpenChange(false);
  }
  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) close();
        }}
      >
        <DialogContent className="pdf-import-dialog" onInteractOutside={(e) => e.preventDefault()}>
          <DialogTitle>Importar relação em PDF</DialogTitle>
          <DialogDescription>
            Leitura e armazenamento neste aparelho. Revise antes de liberar a carga; ainda não há
            sincronização.
          </DialogDescription>
          {open && (
            <PdfImportBody
              guard={guard}
              onCancel={close}
              onClose={() => {
                guard.current = { busy: false, dirty: false };
                onOpenChange(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={discard} onOpenChange={setDiscard}>
        <DialogContent>
          <DialogTitle>Descartar a revisão do PDF?</DialogTitle>
          <DialogDescription>
            A operação ainda não foi criada. Se sair agora, será necessário selecionar e revisar o
            documento novamente.
          </DialogDescription>
          <Btn variant="outline" onClick={() => setDiscard(false)}>
            Continuar revisando
          </Btn>
          <Btn
            onClick={() => {
              guard.current = { busy: false, dirty: false };
              setDiscard(false);
              onOpenChange(false);
            }}
          >
            Descartar revisão
          </Btn>
        </DialogContent>
      </Dialog>
    </>
  );
}
function PdfImportBody({
  onClose,
  onCancel,
  guard,
}: {
  onClose: () => void;
  onCancel: () => void;
  guard: MutableRefObject<{ busy: boolean; dirty: boolean }>;
}) {
  const { state, addOperation } = useOperations();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null),
    [extraction, setExtraction] = useState<PdfExtraction | null>(null);
  const [hash, setHash] = useState(""),
    [rows, setRows] = useState<ImportRow[]>([]),
    [error, setError] = useState("");
  const [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(""),
    [reviewed, setReviewed] = useState(false),
    [reason, setReason] = useState("");
  const [query, setQuery] = useState(""),
    [listPage, setListPage] = useState(0),
    [preview, setPreview] = useState(false),
    [sourcePage, setSourcePage] = useState(1);
  const [data, setData] = useState({
    origem: "",
    placa: "",
    motorista: "",
    chegada: "",
    doca: "",
    responsavel: "",
  });
  const active = useRef(0);
  useEffect(() => {
    guard.current = {
      busy,
      dirty: !!file && !state.operations.some((o) => hash && o.source?.sha256 === hash),
    };
  }, [busy, file, guard, hash, state.operations]);
  useEffect(
    () => () => {
      active.current++;
      guard.current = { busy: false, dirty: false };
    },
    [guard],
  );
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (file) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [file]);
  const previewRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (preview) previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [preview, sourcePage]);
  const duplicates = rows.map((r, i) =>
    rows.some((o, j) => j !== i && o.nf.trim() === r.nf.trim() && o.documento === r.documento),
  );
  const problems = rows.filter((r, i) => rowIssues(r).length || duplicates[i]).length;
  const total = rows.reduce((n, r) => n + (r.previstos || 0), 0);
  const adjusted =
    !!extraction &&
    ((extraction.declaredRows !== null && extraction.declaredRows !== rows.length) ||
      (extraction.declaredVolumes !== null && extraction.declaredVolumes !== total) ||
      extraction.warnings.length > 0);
  const shown = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) =>
      [row.nf, row.destinatario, row.praca]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(query.toLocaleLowerCase("pt-BR")),
    );
  const lastPage = Math.max(0, Math.ceil(shown.length / 10) - 1);
  const visible = shown.slice(
    Math.min(listPage, lastPage) * 10,
    Math.min(listPage, lastPage) * 10 + 10,
  );
  const existing = state.operations.find((o) => hash && o.source?.sha256 === hash);
  async function select(file: File) {
    const ticket = ++active.current;
    setBusy(true);
    setError("");
    setProgress("Abrindo documento…");
    setExtraction(null);
    setReviewed(false);
    setFile(file);
    setQuery("");
    setListPage(0);
    setReason("");
    setPreview(false);
    setHash("");
    try {
      const result = await readCargoPdf(file, (n, total) =>
        setProgress(`Lendo página ${n} de ${total}…`),
      );
      if (active.current !== ticket) return;
      setHash(result.sha256);
      setExtraction(result.extraction);
      setRows(result.extraction.rows);
      setSourcePage(result.extraction.detailPages[0] || 1);
      setData((d) => ({
        ...d,
        placa: result.extraction.plates[0] || "",
        motorista: result.extraction.driver,
      }));
    } catch (e) {
      if (active.current === ticket) setError((e as Error).message);
    } finally {
      if (active.current === ticket) {
        setBusy(false);
        setProgress("");
      }
    }
  }
  function change(index: number, key: keyof ImportRow, value: string | number | null) {
    setReviewed(false);
    setRows((old) => old.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  }
  return (
    <div className="pdf-import-body">
      <label className="pdf-upload">
        <FileUp size={24} />
        <span>
          <strong>{file?.name || "Selecionar relação em PDF"}</strong>
          <small>PDF com texto · até 20 MB e 100 páginas · formato DAMDFE detalhado</small>
        </span>
        <input
          type="file"
          accept="application/pdf,.pdf"
          aria-label="Selecionar relação em PDF"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void select(f);
            e.target.value = "";
          }}
        />
      </label>
      {busy && <p role="status">{progress || "Preservando documento e criando operação…"}</p>}
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      {existing ? (
        <div className="pdf-warning">
          <strong>Este PDF já foi importado.</strong>
          <p>
            {existing.placa} · {existing.id}
          </p>
          <Btn
            onClick={() => {
              onClose();
              navigate({ to: "/conferencias/$id", params: { id: existing.id } });
            }}
          >
            Abrir operação existente
          </Btn>
        </div>
      ) : (
        extraction &&
        file && (
          <>
            <div className="pdf-read-result">
              <strong>
                {rows.length} notas · {total.toLocaleString("pt-BR")} volumes físicos
              </strong>
              <span>
                {extraction.pages} páginas lidas · tabela nas páginas{" "}
                {extraction.detailPages.join(", ")}
              </span>
            </div>
            <fieldset disabled={busy}>
              <legend>1. Confirme a carreta</legend>
              <div className="wizard-grid">
                {(
                  [
                    ["origem", "Origem da carga *"],
                    ["placa", "Placa do veículo *"],
                    ["motorista", "Motorista *"],
                  ] as const
                ).map(([key, label]) => (
                  <label className="field-group" key={key}>
                    <span>{label}</span>
                    <input
                      className="field"
                      value={data[key]}
                      maxLength={150}
                      onChange={(e) => setData({ ...data, [key]: e.target.value })}
                    />
                  </label>
                ))}
              </div>
              {extraction.plates.length > 1 && (
                <p className="field-help">
                  Placas no documento: {extraction.plates.join(" / ")}. Confirme a identificação
                  usada na operação.
                </p>
              )}
              <details className="field-details">
                <summary>Chegada, doca e responsável</summary>
                <div className="wizard-grid">
                  {(
                    [
                      ["chegada", "Data e hora de chegada"],
                      ["doca", "Doca"],
                      ["responsavel", "Conferente responsável"],
                    ] as const
                  ).map(([key, label]) => (
                    <label className="field-group" key={key}>
                      <span>{label}</span>
                      <input
                        className="field"
                        type={key === "chegada" ? "datetime-local" : "text"}
                        value={data[key]}
                        maxLength={150}
                        onChange={(e) => setData({ ...data, [key]: e.target.value })}
                      />
                    </label>
                  ))}
                </div>
                <p className="field-help">
                  Origem e chegada precisam de confirmação operacional. Emissão e início de viagem
                  não são chegada.
                </p>
              </details>
            </fieldset>
            <fieldset disabled={busy}>
              <legend>2. Revise as notas e os volumes</legend>
              <p className="field-help">
                Cliente = destinatário impresso na relação. Pedido e pallet ficam vazios quando não
                constam no PDF. Nenhuma nota será marcada como conferida pela importação.
              </p>
              <SearchBox
                placeholder="Localizar NF, cliente ou destino na prévia"
                value={query}
                onChange={(v) => {
                  setQuery(v);
                  setListPage(0);
                }}
              />
              <div className="pdf-review-table">
                <table>
                  <thead>
                    <tr>
                      <th>NF / documento</th>
                      <th>Cliente / destinatário</th>
                      <th>Destino</th>
                      <th>Volumes</th>
                      <th>Original</th>
                      <th>
                        <span className="sr-only">Remover</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(({ row: r, index: i }) => (
                      <tr key={`${r.sourcePage}-${r.sourceLine}`}>
                        <td>
                          <input
                            className="field"
                            aria-label={`NF da linha ${i + 1}`}
                            value={r.nf}
                            inputMode="numeric"
                            onChange={(e) => change(i, "nf", e.target.value)}
                          />
                          <details>
                            <summary>Doc. {r.documento}</summary>
                            {(
                              [
                                ["documento", "Documento de transporte"],
                                ["remetente", "Remetente"],
                                ["pedido", "Pedido"],
                                ["pallet", "Pallet"],
                              ] as const
                            ).map(([key, label]) => (
                              <label className="field-group" key={key}>
                                <span>{label}</span>
                                <input
                                  className="field"
                                  value={r[key]}
                                  onChange={(e) => change(i, key, e.target.value)}
                                />
                              </label>
                            ))}
                          </details>
                        </td>
                        <td>
                          <textarea
                            className="field"
                            rows={2}
                            aria-label={`Cliente da linha ${i + 1}`}
                            value={r.destinatario}
                            onChange={(e) => change(i, "destinatario", e.target.value)}
                          />
                          {(rowIssues(r).length > 0 || duplicates[i]) && (
                            <span className="error-text">
                              {[...rowIssues(r), duplicates[i] ? "Documento e NF repetidos" : ""]
                                .filter(Boolean)
                                .join(". ")}
                            </span>
                          )}
                        </td>
                        <td>
                          <textarea
                            className="field"
                            rows={2}
                            aria-label={`Destino da linha ${i + 1}`}
                            value={r.praca}
                            onChange={(e) => change(i, "praca", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="field"
                            type="number"
                            min="1"
                            step="1"
                            inputMode="numeric"
                            aria-label={`Volumes da linha ${i + 1}`}
                            value={r.previstos ?? ""}
                            onChange={(e) =>
                              change(
                                i,
                                "previstos",
                                e.target.value === "" ? null : Number(e.target.value),
                              )
                            }
                          />
                        </td>
                        <td>
                          <button
                            className="table-link"
                            type="button"
                            onClick={() => {
                              setSourcePage(r.sourcePage);
                              setPreview(true);
                            }}
                          >
                            Pág. {r.sourcePage}
                          </button>
                        </td>
                        <td>
                          <button
                            className="icon-button"
                            type="button"
                            aria-label={`Remover linha ${i + 1}`}
                            onClick={() => {
                              setRows(rows.filter((_, n) => n !== i));
                              setReviewed(false);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!shown.length && <p>Nenhuma nota nesta pesquisa.</p>}
              <div className="pdf-pagination">
                <span>{shown.length} notas nesta consulta</span>
                <Btn
                  variant="outline"
                  disabled={listPage === 0}
                  onClick={() => setListPage((p) => p - 1)}
                  aria-label="Página anterior da prévia"
                >
                  <ChevronLeft size={17} />
                </Btn>
                <span>
                  {Math.min(listPage, lastPage) + 1} / {lastPage + 1}
                </span>
                <Btn
                  variant="outline"
                  disabled={listPage >= lastPage}
                  onClick={() => setListPage((p) => p + 1)}
                  aria-label="Próxima página da prévia"
                >
                  <ChevronRight size={17} />
                </Btn>
              </div>
            </fieldset>
            <details
              ref={previewRef}
              className="pdf-original-preview"
              open={preview}
              onToggle={(e) => setPreview(e.currentTarget.open)}
            >
              <summary>Ver páginas do PDF original</summary>
              {preview && (
                <>
                  <label className="field-group">
                    <span>Página do original</span>
                    <select
                      className="field"
                      value={sourcePage}
                      onChange={(e) => setSourcePage(Number(e.target.value))}
                    >
                      {Array.from({ length: extraction.pages }, (_, i) => (
                        <option key={i} value={i + 1}>
                          Página {i + 1}
                        </option>
                      ))}
                    </select>
                  </label>
                  <PdfPreview file={file} page={sourcePage} />
                </>
              )}
            </details>
            {adjusted && (
              <div className="pdf-warning">
                <strong>Revise os totais antes de continuar</strong>
                {extraction.warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
                <p>
                  Impresso: {extraction.declaredRows ?? "não informado"} entregas ·{" "}
                  {extraction.declaredVolumes ?? "não informado"} volumes. Prévia: {rows.length}{" "}
                  notas · {total} volumes.
                </p>
                <label className="field-group">
                  <span>Explique o ajuste ou a diferença *</span>
                  <textarea
                    className="field"
                    value={reason}
                    maxLength={2000}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setReviewed(false);
                    }}
                  />
                </label>
              </div>
            )}
            {!!problems && (
              <p role="alert" className="error-text">
                {problems} linha(s) precisam de correção. Notas não serão importadas parcialmente.
              </p>
            )}
            <label className="pdf-review-confirm">
              <input
                type="checkbox"
                checked={reviewed}
                disabled={busy}
                onChange={(e) => setReviewed(e.target.checked)}
              />
              <span>Revisei todas as páginas, as notas e os volumes físicos da relação.</span>
            </label>
            <div className="pdf-import-actions">
              <Btn variant="ghost" disabled={busy} onClick={onCancel}>
                Cancelar
              </Btn>
              <Btn
                disabled={
                  busy ||
                  !reviewed ||
                  !rows.length ||
                  !!problems ||
                  !data.origem.trim() ||
                  !data.placa.trim() ||
                  !data.motorista.trim() ||
                  (adjusted && !reason.trim())
                }
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    if (state.operations.some((o) => o.source?.sha256 === hash))
                      throw new Error("Este PDF já foi importado.");
                    await preservePdf(hash, file);
                    const id = addOperation(
                      {
                        ...data,
                        placa: data.placa.trim().toUpperCase(),
                        responsavel: data.responsavel.trim() || "Não atribuído",
                      },
                      rows.map(({ issues: _issues, ...r }) => ({ ...r, previstos: r.previstos! })),
                      {
                        sha256: hash,
                        name: file.name,
                        size: file.size,
                        pages: extraction.pages,
                        parser: "damdfe-details-v1",
                        reviewedAt: new Date().toISOString(),
                        declaredRows: extraction.declaredRows,
                        declaredVolumes: extraction.declaredVolumes,
                        extractedRows: extraction.rows.length,
                        reviewReason: reason,
                      },
                    );
                    toast.success("PDF preservado e operação criada neste aparelho.");
                    onClose();
                    navigate({ to: "/conferencias/$id", params: { id } });
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Salvando…" : "Confirmar importação"}
              </Btn>
            </div>
          </>
        )
      )}
    </div>
  );
}
