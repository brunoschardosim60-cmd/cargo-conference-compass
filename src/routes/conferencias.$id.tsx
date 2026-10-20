import { meta } from "@/lib/meta";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCheck, Pause, Play, Check, ArrowRight, Save, Info } from "lucide-react";
import { toast } from "sonner";
import {
  PageHeader,
  Panel,
  DataTable,
  SearchBox,
  FilterSelect,
  Btn,
  EmptyState,
} from "@/components/ui-kit";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StatusPill, confMap, nfMap } from "@/components/status";
import { useOperations } from "@/lib/operation-context";
import { canFinish, needsCount, noteError, type Note, type NoteInput } from "@/lib/operation-model";
import type { NfStatus } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { UnsavedChanges } from "@/components/unsaved-changes";
import { CountCalculator } from "@/components/count-calculator";
export const Route = createFileRoute("/conferencias/$id")({
  validateSearch: (s: Record<string, unknown>): { nota?: string } =>
    typeof s["nota"] === "string" ? { nota: s["nota"] } : {},
  head: () => meta("Mesa de conferência", "Conferência logística interna da filial POA."),
  component: Page,
});
function Page() {
  const { id } = Route.useParams();
  const { nota } = Route.useSearch();
  return <Workbench key={id + (nota || "")} id={id} initialNote={nota} />;
}
function Workbench({ id, initialNote }: { id: string; initialNote: string | undefined }) {
  const { state, changeOperation } = useOperations();
  const conf = state.operations.find((o) => o.id === id),
    rows = state.notes.filter((n) => n.conferencia === id);
  const [q, setQ] = useState(""),
    [filter, setFilter] = useState(""),
    [selected, setSelected] = useState(
      rows.find((n) => n.id === initialNote)?.id || rows.find(needsCount)?.id || rows[0]?.id || "",
    ),
    [finish, setFinish] = useState(false);
  const [dirty, setDirty] = useState(false),
    [pendingSelection, setPendingSelection] = useState("");
  function selectNote(noteId: string) {
    if (noteId === selected) return;
    if (dirty) setPendingSelection(noteId);
    else setSelected(noteId);
  }
  const current = rows.find((n) => n.id === selected),
    done = rows.filter((n) => !needsCount(n)).length;
  const list = rows.filter(
    (n) =>
      (!filter || n.status === filter) &&
      [n.nf, n.pedido, n.destinatario, n.pallet, n.praca]
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  if (!conf)
    return (
      <Panel>
        <EmptyState
          title="Operação não encontrada"
          text="Este identificador não corresponde a uma operação disponível. Nenhuma outra carga foi aberta em seu lugar."
        />
        <Link to="/conferencias" className="table-link">
          <ArrowLeft size={14} />
          Voltar às conferências
        </Link>
      </Panel>
    );
  function next(saved = false) {
    const nextRow = rows.find((n) => n.id !== selected && needsCount(n));
    if (nextRow) {
      if (saved) {
        setDirty(false);
        setSelected(nextRow.id);
      } else selectNote(nextRow.id);
      setQ("");
      setFilter("");
    } else toast.info("Não há outras notas pendentes de conferência.");
  }
  return (
    <>
      <Link to="/conferencias" className="table-link mb-5">
        <ArrowLeft size={14} />
        Operações de recebimento
      </Link>
      <PageHeader
        title="Mesa de conferência"
        subtitle={conf.id + " · registre a contagem física de cada nota fiscal."}
        actions={
          <>
            {conf.status === "em_andamento" ? (
              <Btn
                variant="outline"
                disabled={dirty}
                title={dirty ? "Salve a contagem antes de pausar." : undefined}
                onClick={() => {
                  changeOperation(id, "pausada");
                  toast.success("Conferência pausada. Registros mantidos nesta sessão.");
                }}
              >
                <Pause size={14} />
                Pausar
              </Btn>
            ) : (
              conf.status !== "concluida" && (
                <Btn onClick={() => changeOperation(id, "em_andamento")}>
                  <Play size={14} />
                  {conf.status === "pausada" ? "Retomar conferência" : "Iniciar conferência"}
                </Btn>
              )
            )}
            {conf.status === "em_andamento" && (
              <Btn onClick={() => setFinish(true)} disabled={!canFinish(state, id) || dirty}>
                <CheckCheck size={15} />
                Finalizar conferência
              </Btn>
            )}
          </>
        }
      />
      <div className="operation-context">
        <div className="context-item">
          <small>Origem → destino</small>
          <strong>{conf.origem} → POA</strong>
        </div>
        <div className="context-item">
          <small>Veículo / doca</small>
          <strong className="font-mono">
            {conf.placa} / {conf.doca || "Não informada"}
          </strong>
        </div>
        <div className="context-item">
          <small>Motorista</small>
          <strong>{conf.motorista}</strong>
        </div>
        <div className="context-item">
          <small>Responsável</small>
          <strong>{conf.responsavel}</strong>
        </div>
        <div className="context-item">
          <small>Chegada</small>
          <strong>{conf.chegada}</strong>
        </div>
        <div className="ml-auto">
          <StatusPill map={confMap} value={conf.status} />
        </div>
      </div>
      <div className="workbench">
        <div>
          <div className="toolbar">
            <SearchBox
              placeholder="Buscar NF, pedido, cliente ou pallet"
              value={q}
              onChange={setQ}
            />
            <FilterSelect
              label="Situação"
              options={Object.entries(nfMap).map(([k, v]) => [k, v[0]])}
              value={filter}
              onChange={setFilter}
            />
          </div>
          <Panel
            title="Relação da carga"
            actions={
              <span className="muted">
                {done} de {rows.length} NFs verificadas
              </span>
            }
            flush
          >
            <div className="note-table">
              {!list.length ? (
                <EmptyState
                  title="Nenhuma nota nesta busca"
                  text="Limpe o filtro ou confira o número da NF ou do pedido."
                />
              ) : (
                <DataTable head={["Nota / destinatário", "Praça / pallet", "Volumes", "Situação"]}>
                  {list.map((n) => (
                    <tr key={n.id} className={cn(selected === n.id && "note-selected")}>
                      <td>
                        <button
                          onClick={() => selectNote(n.id)}
                          className="cell-primary"
                          aria-pressed={selected === n.id}
                        >
                          NF {n.nf}
                        </button>
                        <div className="cell-sub">{n.destinatario}</div>
                        <div className="cell-sub">Pedido {n.pedido || "não informado"}</div>
                      </td>
                      <td>
                        <span className="text-xs">{n.praca || "Não informada"}</span>
                        <div className="cell-sub">{n.pallet || "Sem pallet"}</div>
                      </td>
                      <td>
                        <span className="font-medium">{n.encontrados ?? "—"}</span>
                        <span className="text-muted-foreground"> / {n.previstos}</span>
                        <div className="cell-sub">encontrados / previstos</div>
                      </td>
                      <td>
                        <StatusPill map={nfMap} value={n.status} />
                      </td>
                    </tr>
                  ))}
                </DataTable>
              )}
            </div>
            <div className="table-footer">
              <span>{list.length} notas na relação filtrada</span>
              <span>{rows.reduce((a, n) => a + n.previstos, 0)} volumes previstos</span>
            </div>
          </Panel>
          <div className="info-strip mt-4">
            <Info size={16} className="shrink-0 mt-0.5" />
            <span>
              Um volume não localizado ainda pode estar no pavilhão. Use{" "}
              <strong>pendente de localização</strong> até a falta ser confirmada.
            </span>
          </div>
          {conf.iniciadaEm && (
            <p className="muted mt-4">Início da conferência: {conf.iniciadaEm}</p>
          )}
          {conf.concluidaEm && (
            <p className="muted mt-4">
              Finalizada em {conf.concluidaEm} · divergências seguem disponíveis no administrativo.
            </p>
          )}
        </div>
        {current ? (
          <NoteEditor
            key={current.id}
            note={current}
            editable={conf.status === "em_andamento"}
            onNext={next}
            onDirty={setDirty}
          />
        ) : (
          <Panel>
            <EmptyState
              title="Relação vazia"
              text="Esta operação ainda não tem notas disponíveis."
            />
          </Panel>
        )}
      </div>
      <Dialog
        open={!!pendingSelection}
        onOpenChange={(v) => {
          if (!v) setPendingSelection("");
        }}
      >
        <DialogContent>
          <DialogTitle>Há uma contagem não salva</DialogTitle>
          <DialogDescription>
            Salve o registro antes de mudar de nota ou descarte o rascunho.
          </DialogDescription>
          <div className="flex justify-end gap-2">
            <Btn variant="outline" onClick={() => setPendingSelection("")}>
              Voltar e salvar
            </Btn>
            <Btn
              onClick={() => {
                setSelected(pendingSelection);
                setPendingSelection("");
                setDirty(false);
              }}
            >
              Descartar e abrir nota
            </Btn>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={finish} onOpenChange={setFinish}>
        <DialogContent>
          <DialogTitle>Finalizar esta conferência?</DialogTitle>
          <DialogDescription>
            A contagem ficará em consulta. As divergências permanecem abertas para análise
            administrativa.
          </DialogDescription>
          <div className="info-strip">
            {done} notas verificadas · {rows.filter((n) => n.status !== "conferida").length} com
            divergência ou localização pendente.
          </div>
          <p className="muted">
            Esta ação será registrada somente na sessão de demonstração. Nenhuma ocorrência oficial
            será lançada.
          </p>
          <div className="flex justify-end gap-2">
            <Btn variant="outline" onClick={() => setFinish(false)}>
              Continuar conferindo
            </Btn>
            <Btn
              onClick={() => {
                changeOperation(id, "concluida");
                setFinish(false);
                toast.success("Conferência finalizada nesta sessão.");
              }}
            >
              Confirmar finalização
            </Btn>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
function NoteEditor({
  note,
  editable,
  onNext,
  onDirty,
}: {
  note: Note;
  editable: boolean;
  onNext: (saved?: boolean) => void;
  onDirty: (dirty: boolean) => void;
}) {
  const { record } = useOperations();
  const [quantity, setQuantity] = useState(
      note.encontrados === null ? "" : String(note.encontrados),
    ),
    [status, setStatus] = useState<NfStatus>(note.status),
    [observation, setObservation] = useState(note.observacao),
    [error, setError] = useState("");
  const countRef = useRef<HTMLInputElement>(null);
  const [calculation, setCalculation] = useState(note.calculo || "");
  const delta = quantity === "" ? null : Number(quantity) - note.previstos;
  const dirty =
    quantity !== (note.encontrados === null ? "" : String(note.encontrados)) ||
    status !== note.status ||
    observation !== note.observacao ||
    calculation !== (note.calculo || "");
  useEffect(() => {
    onDirty(dirty);
  }, [dirty, onDirty]);
  useEffect(() => {
    if (editable) countRef.current?.focus({ preventScroll: true });
  }, [editable]);
  function save(advance: boolean) {
    const input: NoteInput = {
      encontrados: quantity === "" ? NaN : Number(quantity),
      status,
      observacao: observation,
      calculo: calculation,
    };
    const issue = noteError(input, note.previstos);
    setError(issue);
    if (issue) return;
    record(note.id, input);
    toast.success("NF " + note.nf + " registrada na sessão.");
    if (advance) onNext(true);
  }
  const options: [NfStatus, string][] = [
    ["conferida", "Sem divergência"],
    ["localizacao", "A localizar"],
    ["falta", "Falta confirmada"],
    ["avaria", "Avaria"],
    ["excedente", "Excedente"],
    ["divergencia", "Não identificado"],
  ];
  return (
    <section className="panel note-editor">
      <UnsavedChanges dirty={dirty} />
      <header className="editor-header">
        <div className="eyebrow !mb-1">REGISTRO DA CONTAGEM</div>
        <h2>NF {note.nf}</h2>
        <p className="muted">{note.destinatario}</p>
      </header>
      <div className="editor-body">
        <div className="flex justify-between">
          <span className="muted">Pedido {note.pedido || "não informado"}</span>
          <span className="muted">{note.pallet || "Sem pallet"}</span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save(true);
          }}
        >
          <fieldset disabled={!editable}>
            <legend className="sr-only">Resultado da nota {note.nf}</legend>
            <div className="quantity-grid">
              <div>
                <small>PREVISTOS</small>
                <strong>{note.previstos}</strong>
              </div>
              <label>
                <small>ENCONTRADOS</small>
                <input
                  ref={countRef}
                  aria-label="Volumes encontrados"
                  type="number"
                  min={0}
                  step={1}
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    setCalculation("");
                  }}
                  placeholder="0"
                />
              </label>
              <div>
                <small>DIFERENÇA</small>
                <strong
                  className={
                    delta === null
                      ? ""
                      : delta < 0
                        ? "text-danger"
                        : delta > 0
                          ? "text-warning"
                          : "text-success"
                  }
                >
                  {delta === null ? "—" : delta > 0 ? "+" + delta : delta}
                </strong>
              </div>
            </div>
            <CountCalculator
              onApply={(count, expression) => {
                setQuantity(String(count));
                setCalculation(expression);
                if (!["avaria", "divergencia"].includes(status))
                  setStatus(
                    count === note.previstos
                      ? "conferida"
                      : count > note.previstos
                        ? "excedente"
                        : "localizacao",
                  );
              }}
            />
            {calculation && (
              <p className="audit-calculation">
                Conta utilizada: {calculation} = {quantity}
              </p>
            )}
            <span className="field-label">Resultado da conferência</span>
            <div className="result-options">
              {options.map(([v, l]) => (
                <label className="result-option" key={v}>
                  <input
                    name="result"
                    type="radio"
                    value={v}
                    checked={status === v}
                    onChange={() => setStatus(v)}
                  />
                  {l}
                </label>
              ))}
            </div>
            <label className="field-group">
              <span>
                Observações {status !== "conferida" ? "· obrigatórias nas divergências" : ""}
              </span>
              <textarea
                rows={3}
                maxLength={2000}
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                className="field"
                placeholder="Descreva a condição, a localização ou a avaria…"
              />
            </label>
            {error && (
              <p role="alert" className="error-text">
                {error}
              </p>
            )}
            <div className="editor-actions">
              <Btn variant="outline" onClick={() => save(false)}>
                <Save size={14} />
                Salvar
              </Btn>
              <Btn type="submit">
                <Check size={14} />
                Salvar e próxima
              </Btn>
            </div>
          </fieldset>
        </form>
        {!editable && (
          <div className="info-strip mt-4">
            {note.status === "pendente"
              ? "Inicie ou retome a conferência para registrar esta nota."
              : "Registro em consulta. A operação deve estar em andamento para editar."}
          </div>
        )}
        <p aria-live="polite" className="text-[10px] text-muted-foreground mt-4">
          {dirty
            ? "Rascunho não salvo · salve antes de selecionar outra nota."
            : note.registradoPor
              ? "Último registro: " + note.registradoPor + " · " + note.registradoEm
              : "Aguardando contagem física."}
        </p>
        <button onClick={() => onNext()} className="table-link mt-3">
          Próxima nota pendente <ArrowRight size={13} />
        </button>
      </div>
    </section>
  );
}
