import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useOperations } from "@/lib/operation-context";
import { canFinish, needsCount, noteError, type Note } from "@/lib/operation-model";
import { clientGroups } from "@/lib/client-groups";
import type { NfStatus } from "@/lib/demo-data";
import { Btn, EmptyState, SearchBox } from "./ui-kit";
import { StatusPill, confMap, nfMap } from "./status";
import { UnsavedChanges } from "./unsaved-changes";
import { EvidencePhotos } from "./evidence-photos";
import { productSummary } from "@/lib/product-count";
import { readNoteDraft, clearNoteDraft, useNoteDraft } from "@/hooks/use-note-draft";
import { CountCalculator } from "./count-calculator";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";

export function FieldOperations() {
  const { state } = useOperations();
  const [query, setQuery] = useState("");
  const [completed, setCompleted] = useState(false);
  const rows = state.operations.filter(
    (o) =>
      (o.status === "concluida") === completed &&
      [o.placa, o.origem, o.id].join(" ").toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <div className="field-page-heading">
        <span className="document-kicker">
          <span />
          RECEBIMENTO / PAVILHÃO
        </span>
        <h1>Qual carga vai conferir?</h1>
        <p>Escolha a carreta. Depois, o cliente e a nota.</p>
      </div>
      <SearchBox placeholder="Buscar placa ou origem" value={query} onChange={setQuery} />
      <div className="field-tabs" aria-label="Situação das cargas">
        <button aria-pressed={!completed} onClick={() => setCompleted(false)}>
          Para conferir
        </button>
        <button aria-pressed={completed} onClick={() => setCompleted(true)}>
          Concluídas
        </button>
      </div>
      <div className="field-list">
        {rows.map((o) => {
          const notes = state.notes.filter((n) => n.conferencia === o.id);
          const done = notes.filter((n) => !needsCount(n)).length;
          return (
            <Link key={o.id} to="/conferir/$id" params={{ id: o.id }} className="field-operation">
              <div className="load-ticket">
                <span className="load-ticket-dock">
                  <small>DOCA</small>
                  <strong>{o.doca || "—"}</strong>
                </span>
                <div className="field-row-text">
                  <strong>{o.placa}</strong>
                  <span>{o.origem} → POA</span>
                  <StatusPill map={confMap} value={o.status} />
                </div>
                <ChevronRight size={19} />
              </div>
              <progress
                value={done}
                max={Math.max(notes.length, 1)}
                aria-label={`${done} de ${notes.length} notas verificadas`}
              />
              <div className="field-row field-muted">
                <span>
                  <strong>{done}</strong> / {notes.length} notas conferidas
                </span>
                <span>{o.id}</span>
              </div>
            </Link>
          );
        })}
      </div>
      {!rows.length && (
        <EmptyState
          title="Nenhuma carga nesta lista"
          text="Tente outra busca ou consulte as cargas concluídas."
        />
      )}
    </>
  );
}

export function FieldConference({ id }: { id: string }) {
  const { state, changeOperation } = useOperations();
  const [client, setClient] = useState("");
  const [noteId, setNoteId] = useState("");
  const [query, setQuery] = useState("");
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [finish, setFinish] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [client, noteId]);
  const operation = state.operations.find((o) => o.id === id);
  const groups = clientGroups(state.notes, id);
  const currentGroup = groups.find((g) => g.name === client);
  const note = currentGroup?.rows.find((n) => n.id === noteId);
  const rows = state.notes.filter((n) => n.conferencia === id);
  const searchRows = rows.filter((n) =>
    [n.nf, n.pedido, n.destinatario, n.praca]
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const done = rows.filter((n) => !needsCount(n)).length;
  const editable = operation?.status === "em_andamento";
  function back() {
    if (dirty) {
      setDiscard(true);
      return;
    }
    if (noteId) setNoteId("");
    else {
      setClient("");
      setQuery("");
    }
  }
  if (!operation)
    return (
      <>
        <Link to="/conferir" className="field-back">
          <ArrowLeft size={17} />
          Voltar às cargas
        </Link>
        <EmptyState
          title="Carga não encontrada"
          text="Volte à lista e selecione uma operação disponível."
        />
      </>
    );
  return (
    <>
      <UnsavedChanges
        dirty={dirty}
        onDiscard={() => {
          if (noteId) clearNoteDraft(noteId);
        }}
      />
      {savedMessage && (
        <p className="field-save-receipt" role="status">
          <CheckCircle2 size={20} />
          {savedMessage}
        </p>
      )}
      {client ? (
        <button className="field-back" onClick={back}>
          <ArrowLeft size={17} />
          {note ? "Notas do cliente" : "Todos os clientes"}
        </button>
      ) : (
        <Link to="/conferir" className="field-back">
          <ArrowLeft size={17} />
          Todas as cargas
        </Link>
      )}
      <div className="field-load-heading">
        <div>
          <span className="eyebrow">
            <span className="load-dock-label">{operation.doca || "SEM DOCA"}</span>
            <span className="load-plate-label">{operation.placa}</span>
          </span>
          <h1 ref={headingRef} tabIndex={-1}>
            {note ? `NF ${note.nf}` : client || "Clientes da carga"}
          </h1>
          {note && <p>{client}</p>}
        </div>
      </div>
      {!note && (
        <div className="field-progress">
          <progress value={done} max={Math.max(rows.length, 1)} aria-label="Progresso da carga" />
          <span>
            {done} de {rows.length} notas conferidas
          </span>
        </div>
      )}
      {!client && (
        <details className="field-details">
          <summary>Detalhes da carga</summary>
          <dl>
            <dt>Operação</dt>
            <dd>{id}</dd>
            <dt>Origem</dt>
            <dd>{operation.origem}</dd>
            <dt>Motorista</dt>
            <dd>{operation.motorista}</dd>
            <dt>Chegada</dt>
            <dd>{operation.chegada}</dd>
            <dt>Responsável</dt>
            <dd>{operation.responsavel}</dd>
          </dl>
          <StatusPill map={confMap} value={operation.status} />
          {editable && (
            <Btn variant="outline" onClick={() => changeOperation(id, "pausada")}>
              Pausar conferência
            </Btn>
          )}
        </details>
      )}
      {!editable && operation.status !== "concluida" && (
        <Btn className="field-primary" onClick={() => changeOperation(id, "em_andamento")}>
          {operation.status === "pausada" ? "Retomar conferência" : "Iniciar conferência"}
          <ArrowRight size={17} />
        </Btn>
      )}
      {operation.status === "concluida" && (
        <p className="field-complete">
          <CheckCircle2 size={18} />
          Conferência concluída · somente consulta
        </p>
      )}
      {note ? (
        <FieldNote
          key={note.id}
          note={note}
          editable={editable}
          onDirty={setDirty}
          onSaved={() => {
            setDirty(false);
            setSavedMessage(`NF ${note.nf} salva neste aparelho.`);
            const next = currentGroup?.rows.find((n) => n.id !== note.id && needsCount(n));
            setNoteId(next?.id || "");
            if (!next) {
              setClient("");
              setQuery("");
            }
          }}
        />
      ) : (
        <>
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder={client ? "Buscar NF ou pedido" : "Buscar cliente, NF ou pedido"}
          />
          <div className="field-section-label">
            {client || query.trim()
              ? "Toque na nota para conferir"
              : "Toque no cliente para ver as notas"}
          </div>
          <div className="field-list">
            {!client && query.trim()
              ? searchRows.map((n) => (
                  <button
                    className="field-client"
                    key={n.id}
                    onClick={() => {
                      setClient(n.destinatario.trim() || "Destinatário não informado");
                      setNoteId(n.id);
                      setQuery("");
                      setSavedMessage("");
                    }}
                  >
                    <span className="field-row-text">
                      <strong>NF {n.nf}</strong>
                      <span>{n.destinatario}</span>
                      <StatusPill map={nfMap} value={n.status} />
                    </span>
                    <span className="relation-line-volumes">
                      <strong>{n.previstos}</strong>
                      <small>PREVISTOS</small>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                ))
              : currentGroup
                ? currentGroup.rows
                    .filter((n) => [n.nf, n.pedido].join(" ").includes(query.trim()))
                    .map((n, index) => (
                      <button
                        className="field-client"
                        key={n.id}
                        onClick={() => {
                          setNoteId(n.id);
                          setSavedMessage("");
                        }}
                      >
                        <span className="relation-line-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="field-row-text">
                          <strong>NF {n.nf}</strong>
                          <span>{n.pedido || "Sem pedido"}</span>
                          <StatusPill map={nfMap} value={n.status} />
                        </span>
                        <span className="relation-line-volumes">
                          <strong>{n.previstos}</strong>
                          <small>VOL.</small>
                        </span>
                        <ChevronRight size={15} />
                      </button>
                    ))
                : clientGroups(state.notes, id, query).map((g, index) => (
                    <button
                      className="field-client"
                      key={g.name}
                      onClick={() => {
                        setClient(g.name);
                        setQuery("");
                        setSavedMessage("");
                      }}
                    >
                      <span className="relation-line-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="field-row-text">
                        <strong>{g.name}</strong>
                        <span>
                          {g.rows.length} {g.rows.length === 1 ? "nota fiscal" : "notas fiscais"}
                        </span>
                        <small
                          className={
                            g.remaining ? "" : g.issues ? "line-has-issue" : "line-checked"
                          }
                        >
                          {g.remaining
                            ? `${g.remaining} ${g.remaining === 1 ? "nota para conferir" : "notas para conferir"}`
                            : g.issues
                              ? "Conferido · com divergência"
                              : "Contagem concluída"}
                        </small>
                      </span>
                      <span className="relation-line-volumes">
                        <strong>{g.expected}</strong>
                        <small>VOL.</small>
                      </span>
                      <ChevronRight size={15} />
                    </button>
                  ))}
          </div>
          {((!currentGroup && (query.trim() ? !searchRows.length : !groups.length)) ||
            (currentGroup &&
              !currentGroup.rows.some((n) =>
                [n.nf, n.pedido].join(" ").includes(query.trim()),
              ))) && (
            <EmptyState
              title="Nenhum resultado"
              text="Confira a busca ou tente o número da nota."
            />
          )}
          {!client && editable && canFinish(state, id) && (
            <div className="field-finish">
              <CheckCircle2 size={23} />
              <h2>Todas as notas conferidas</h2>
              <p>As divergências seguem para o administrativo.</p>
              <Btn className="field-primary" onClick={() => setFinish(true)}>
                Finalizar carga
              </Btn>
            </div>
          )}
        </>
      )}
      <Dialog open={discard} onOpenChange={setDiscard}>
        <DialogContent>
          <DialogTitle>Contagem não salva</DialogTitle>
          <DialogDescription>
            Continue a conferência ou descarte esta alteração para voltar.
          </DialogDescription>
          <Btn variant="outline" onClick={() => setDiscard(false)}>
            Continuar conferindo
          </Btn>
          <Btn
            onClick={() => {
              clearNoteDraft(noteId);
              setDiscard(false);
              setDirty(false);
              setNoteId("");
            }}
          >
            Descartar e voltar
          </Btn>
        </DialogContent>
      </Dialog>
      <Dialog open={finish} onOpenChange={setFinish}>
        <DialogContent>
          <DialogTitle>Finalizar esta carga?</DialogTitle>
          <DialogDescription>
            {rows.length} notas verificadas. A contagem ficará em consulta e as pendências
            continuarão com o administrativo.
          </DialogDescription>
          <Btn variant="outline" onClick={() => setFinish(false)}>
            Continuar conferindo
          </Btn>
          <Btn
            onClick={() => {
              changeOperation(id, "concluida");
              setFinish(false);
              toast.success("Carga finalizada nesta demonstração.");
            }}
          >
            Confirmar finalização
          </Btn>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FieldNote({
  note,
  editable,
  onDirty,
  onSaved,
}: {
  note: Note;
  editable: boolean;
  onDirty: (v: boolean) => void;
  onSaved: () => void;
}) {
  const { record } = useOperations();
  const [draft] = useState(() => readNoteDraft(note.id, note.registradoEm));
  const [divergence, setDivergence] = useState(
    draft?.divergence ?? (note.encontrados !== null && note.status !== "conferida"),
  );
  const [quantity, setQuantity] = useState(
    draft?.quantity ?? (note.encontrados === null ? "" : String(note.encontrados)),
  );
  const [status, setStatus] = useState<NfStatus>(
    draft?.status ??
      (note.status === "pendente" || note.status === "conferida" ? "localizacao" : note.status),
  );
  const [observation, setObservation] = useState(draft?.observation ?? note.observacao);
  const [error, setError] = useState("");
  const [calculation, setCalculation] = useState(draft?.calculation ?? note.calculo ?? "");
  const [products, setProducts] = useState(draft?.products ?? note.produtos);
  const [photos, setPhotos] = useState(draft?.photos ?? note.photos ?? []);
  const dirty =
    JSON.stringify(products) !== JSON.stringify(note.produtos) ||
    JSON.stringify(photos) !== JSON.stringify(note.photos ?? []) ||
    quantity !== (note.encontrados === null ? "" : String(note.encontrados)) ||
    observation !== note.observacao ||
    calculation !== (note.calculo || "") ||
    (divergence &&
      status !==
        (note.status === "pendente" || note.status === "conferida" ? "localizacao" : note.status));
  useEffect(() => {
    onDirty(dirty);
  }, [dirty, onDirty]);
  const draftMessage = useNoteDraft(
    note.id,
    { quantity, status, observation, calculation, divergence, products, photos },
    dirty,
    note.registradoEm,
  );
  const delta = quantity === "" ? null : Number(quantity) - note.previstos;
  function save(exact: boolean) {
    const input = {
      produtos: products,
      photos,
      ...(exact
        ? {
            encontrados: note.previstos,
            status: "conferida" as const,
            observacao: observation,
            calculo: note.encontrados === note.previstos ? note.calculo || "" : "",
          }
        : {
            encontrados: quantity === "" ? NaN : Number(quantity),
            status,
            observacao: observation,
            calculo: calculation,
          }),
    };
    const issue = noteError(input, note.previstos);
    setError(issue);
    if (issue || !editable) return;
    try {
      record(note.id, input);
    } catch (error) {
      setError((error as Error).message);
      return;
    }
    clearNoteDraft(note.id);
    toast.success(`NF ${note.nf} salva neste aparelho.`);
    onSaved();
  }
  return (
    <div className="field-count">
      <div className="field-expected">
        <div className="count-sheet-value">
          <div>
            <span>Volumes previstos</span>
            <small>Quantidade na relação</small>
          </div>
          <strong>
            {note.previstos}
            <small>VOL.</small>
          </strong>
        </div>
      </div>
      {!editable ? (
        <div className="field-saved">
          <StatusPill map={nfMap} value={note.status} />
          <p>Encontrados: {note.encontrados ?? "Ainda não contado"}</p>
          <p>{note.observacao}</p>
        </div>
      ) : (
        <>
          {note.encontrados !== null && (
            <div className="field-previous">
              <strong>Já registrado: {note.encontrados} volumes</strong>
              <StatusPill map={nfMap} value={note.status} />
              <p>{note.observacao}</p>
            </div>
          )}
          <div className="note-tools">
            <CountCalculator
              expectedVolumes={note.previstos}
              products={products}
              onApplyProducts={setProducts}
              onApply={(count, expression) => {
                setQuantity(String(count));
                setCalculation(expression);
                setDivergence(true);
                setError("");
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
          </div>
          {products && (
            <p className="product-record" role="status">
              <strong>Produtos: {products.total} unidades</strong>
              <span>{productSummary(products)}</span>
              <small>Registro auxiliar · volumes conferidos separadamente.</small>
            </p>
          )}
          <details className="field-details">
            <summary>
              Foto da etiqueta ou mercadoria {photos.length ? `(${photos.length})` : ""}
            </summary>
            <EvidencePhotos photos={photos} onChange={setPhotos} />
          </details>
          {!divergence ? (
            <>
              <p className="field-instruction">
                Confira fisicamente os volumes antes de confirmar.
              </p>
              <details className="field-details">
                <summary>Adicionar observação</summary>
                <label className="field-group">
                  <span>Observação da contagem</span>
                  <textarea
                    className="field"
                    rows={2}
                    maxLength={2000}
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                  />
                </label>
              </details>
              <Btn className="field-primary" onClick={() => save(true)}>
                <Check size={19} />
                Confirmar {note.previstos} volumes
              </Btn>
              <Btn
                className="field-secondary"
                variant="outline"
                onClick={() => setDivergence(true)}
              >
                <AlertTriangle size={17} />
                Informar divergência
              </Btn>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save(false);
              }}
            >
              <label className="field-count-label">
                Quantos volumes encontrou?
                <input
                  aria-label="Volumes encontrados"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={quantity}
                  placeholder="Digite a quantidade"
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    setCalculation("");
                  }}
                />
              </label>
              {calculation && (
                <p className="field-calculation">
                  Conta utilizada: {calculation} = {quantity}
                </p>
              )}
              {delta !== null && (
                <p className="field-difference" aria-live="polite">
                  {delta === 0
                    ? "Quantidade completa"
                    : delta < 0
                      ? `${Math.abs(delta)} volume(s) a menos`
                      : `${delta} volume(s) a mais`}
                </p>
              )}
              <label className="field-group">
                <span>O que aconteceu?</span>
                <select
                  className="field"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as NfStatus)}
                >
                  <option value="localizacao">Ainda não localizado</option>
                  <option value="falta">Falta confirmada</option>
                  <option value="avaria">Avaria</option>
                  <option value="excedente">Volume excedente</option>
                  <option value="divergencia">Volume não identificado</option>
                  <option value="conferida">Localizado · sem divergência</option>
                </select>
              </label>
              {status === "localizacao" && (
                <p className="field-help">Ainda estamos procurando. Isso não confirma uma falta.</p>
              )}
              <label className="field-group">
                <span>Observação {status !== "conferida" && "*"}</span>
                <textarea
                  className="field"
                  rows={3}
                  maxLength={2000}
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Ex.: falta localizar 1 caixa no pallet P-02"
                />
              </label>
              {error && (
                <p role="alert" className="error-text">
                  {error}
                </p>
              )}
              <Btn type="submit" className="field-primary">
                Salvar e continuar
                <ArrowRight size={17} />
              </Btn>
            </form>
          )}
        </>
      )}
      <details className="field-details">
        <summary>Mais informações da nota</summary>
        <dl>
          <dt>Pallet / praça</dt>
          <dd>
            {note.pallet || "Não informado"} · {note.praca || "Não informada"}
          </dd>
          <dt>Pedido</dt>
          <dd>{note.pedido || "Não informado"}</dd>
          <dt>Remetente</dt>
          <dd>{note.remetente || "Não informado"}</dd>
          <dt>Último registro</dt>
          <dd>
            {note.registradoPor
              ? `${note.registradoPor} · ${note.registradoEm}`
              : "Ainda não conferida"}
          </dd>
          {note.calculo && (
            <>
              <dt>Conta registrada</dt>
              <dd>
                {note.calculo} = {note.encontrados}
              </dd>
            </>
          )}
        </dl>
      </details>
      {!editable && (
        <>
          <EvidencePhotos photos={note.photos || []} />
          {note.produtos && (
            <p className="product-record">Produtos: {productSummary(note.produtos)}</p>
          )}
        </>
      )}
      {error && !divergence && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      {editable && (
        <p className="field-save-state" aria-live="polite">
          {dirty ? draftMessage : "Teste local · sem sincronização com outros aparelhos."}
        </p>
      )}
    </div>
  );
}
