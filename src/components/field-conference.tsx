import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Package,
  Truck,
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
        <span className="eyebrow">PAVILHÃO · POA</span>
        <h1>Qual carga vamos conferir?</h1>
        <p>Escolha a carreta para ver os clientes.</p>
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
              <div className="field-row">
                <span className="field-item-icon">
                  <Truck size={20} />
                </span>
                <div className="field-row-text">
                  <strong>{o.placa}</strong>
                  <span>{o.origem} → POA</span>
                </div>
                <ChevronRight size={19} />
              </div>
              <div className="field-row field-operation-meta">
                <StatusPill map={confMap} value={o.status} />
                <span>{o.doca || "Doca não informada"}</span>
              </div>
              <progress
                value={done}
                max={Math.max(notes.length, 1)}
                aria-label={`${done} de ${notes.length} notas verificadas`}
              />
              <div className="field-row field-muted">
                <span>
                  {done} de {notes.length} notas
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
  const operation = state.operations.find((o) => o.id === id);
  const groups = clientGroups(state.notes, id);
  const currentGroup = groups.find((g) => g.name === client);
  const note = currentGroup?.rows.find((n) => n.id === noteId);
  const rows = state.notes.filter((n) => n.conferencia === id);
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
      <UnsavedChanges dirty={dirty} />
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
            {operation.doca || "SEM DOCA"} · {operation.placa}
          </span>
          <h1>{note ? `NF ${note.nf}` : client || "Clientes da carga"}</h1>
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
            {client ? "Toque na nota para conferir" : "Toque no cliente para ver as notas"}
          </div>
          <div className="field-list">
            {currentGroup
              ? currentGroup.rows
                  .filter((n) => [n.nf, n.pedido].join(" ").includes(query.trim()))
                  .map((n) => (
                    <button className="field-client" key={n.id} onClick={() => setNoteId(n.id)}>
                      <span
                        className={`field-item-icon ${!needsCount(n) ? (n.status === "conferida" ? "is-done" : "has-issue") : ""}`}
                      >
                        {needsCount(n) ? (
                          <Package size={19} />
                        ) : n.status === "conferida" ? (
                          <Check size={19} />
                        ) : (
                          <AlertTriangle size={19} />
                        )}
                      </span>
                      <span className="field-row-text">
                        <strong>NF {n.nf}</strong>
                        <span>
                          {n.previstos} volumes · {n.pedido || "Sem pedido"}
                        </span>
                        <StatusPill map={nfMap} value={n.status} />
                      </span>
                      <ChevronRight size={18} />
                    </button>
                  ))
              : clientGroups(state.notes, id, query).map((g) => (
                  <button
                    className="field-client"
                    key={g.name}
                    onClick={() => {
                      setClient(g.name);
                      setQuery("");
                    }}
                  >
                    <span
                      className={`field-item-icon ${!g.remaining ? (g.issues ? "has-issue" : "is-done") : ""}`}
                    >
                      {g.remaining ? (
                        <Package size={20} />
                      ) : g.issues ? (
                        <AlertTriangle size={20} />
                      ) : (
                        <Check size={20} />
                      )}
                    </span>
                    <span className="field-row-text">
                      <strong>{g.name}</strong>
                      <span>
                        {g.rows.length} {g.rows.length === 1 ? "nota" : "notas"} · {g.expected}{" "}
                        volumes
                      </span>
                      <small>
                        {g.remaining
                          ? `${g.remaining} ${g.remaining === 1 ? "nota para conferir" : "notas para conferir"}`
                          : g.issues
                            ? "Conferido · com divergência"
                            : "Contagem concluída"}
                      </small>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                ))}
          </div>
          {((!currentGroup && !clientGroups(state.notes, id, query).length) ||
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
  const [divergence, setDivergence] = useState(
    note.encontrados !== null && note.status !== "conferida",
  );
  const [quantity, setQuantity] = useState(
    note.encontrados === null ? "" : String(note.encontrados),
  );
  const [status, setStatus] = useState<NfStatus>(
    note.status === "pendente" || note.status === "conferida" ? "localizacao" : note.status,
  );
  const [observation, setObservation] = useState(note.observacao);
  const [error, setError] = useState("");
  const dirty =
    quantity !== (note.encontrados === null ? "" : String(note.encontrados)) ||
    observation !== note.observacao ||
    (divergence &&
      status !==
        (note.status === "pendente" || note.status === "conferida" ? "localizacao" : note.status));
  useEffect(() => {
    onDirty(dirty);
  }, [dirty, onDirty]);
  const delta = quantity === "" ? null : Number(quantity) - note.previstos;
  function save(exact: boolean) {
    const input = exact
      ? { encontrados: note.previstos, status: "conferida" as const, observacao: note.observacao }
      : { encontrados: quantity === "" ? NaN : Number(quantity), status, observacao: observation };
    const issue = noteError(input, note.previstos);
    setError(issue);
    if (issue || !editable) return;
    record(note.id, input);
    toast.success(`NF ${note.nf} salva nesta sessão.`);
    onSaved();
  }
  return (
    <div className="field-count">
      <div className="field-expected">
        <span>Volumes previstos</span>
        <strong>{note.previstos}</strong>
        <small>
          {note.pallet || "Pallet não informado"} · {note.praca || "Praça não informada"}
        </small>
      </div>
      {!editable ? (
        <div className="field-saved">
          <StatusPill map={nfMap} value={note.status} />
          <p>Encontrados: {note.encontrados ?? "Ainda não contado"}</p>
          <p>{note.observacao}</p>
        </div>
      ) : (
        <>
          {!divergence ? (
            <>
              <p className="field-instruction">
                Confira fisicamente os volumes antes de confirmar.
              </p>
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
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </label>
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
        </dl>
      </details>
    </div>
  );
}
