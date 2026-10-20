import { useEffect, useState } from "react";
import { CheckCircle2, MapPin } from "lucide-react";
import { useOperations } from "@/lib/operation-context";
import type { Case, Evidence } from "@/lib/operation-model";
import { Btn, EmptyState, SearchBox } from "./ui-kit";
import { StatusPill, nfMap } from "./status";
import { EvidencePhotos } from "./evidence-photos";
import { UnsavedChanges } from "./unsaved-changes";

export function FieldShortages() {
  const { state } = useOperations();
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [destination, setDestination] = useState("");
  const [selected, setSelected] = useState("");
  const rows = state.cases.filter((c) => {
    const note = state.notes.find(
      (n) => n.conferencia === c.conferencia && (c.noteId ? n.id === c.noteId : n.nf === c.nf),
    );
    return (
      !["resolvida", "cancelada"].includes(c.status) &&
      (["falta", "localizacao"].includes(c.tipo) ||
        (c.registroOriginal && c.registroOriginal.encontrados < c.registroOriginal.previstos) ||
        (note?.encontrados != null && note.encontrados < note.previstos)) &&
      [c.nf, c.cliente].join(" ").toLowerCase().includes(query.trim().toLowerCase()) &&
      (!date || c.data === date) &&
      (!destination || (note?.praca || "").toLowerCase().includes(destination.trim().toLowerCase()))
    );
  });
  return (
    <>
      <div className="field-page-heading">
        <h1>Faltas em aberto</h1>
        <p>Consulte dias anteriores e avise se encontrou um volume.</p>
      </div>
      <SearchBox
        value={query}
        onChange={(value) => {
          if (!selected) setQuery(value);
        }}
        placeholder="Buscar NF ou cliente"
      />
      <details className="field-details">
        <summary>Filtrar por data ou destino</summary>
        <label className="field-group">
          <span>Data da pendência</span>
          <input
            disabled={!!selected}
            className="field"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="field-group">
          <span>Destino</span>
          <input
            disabled={!!selected}
            className="field"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </label>
        <Btn
          type="button"
          variant="ghost"
          disabled={!!selected}
          onClick={() => {
            setDate("");
            setDestination("");
            setQuery("");
          }}
        >
          Limpar filtros
        </Btn>
      </details>
      {selected && <p className="field-help">Termine ou cancele o aviso antes de mudar a busca.</p>}
      <div className="shortage-list">
        {rows.map((item) => {
          const note = state.notes.find(
            (n) =>
              n.conferencia === item.conferencia &&
              (item.noteId ? n.id === item.noteId : n.nf === item.nf),
          );
          const original = item.registroOriginal;
          const missing = original
            ? Math.max(0, original.previstos - original.encontrados)
            : note?.encontrados != null
              ? Math.max(0, note.previstos - note.encontrados)
              : null;
          const pending = item.discoveries?.find((d) => d.state === "pending");
          return (
            <article className="shortage-item" key={item.id}>
              <header>
                <div>
                  <h2>NF {item.nf}</h2>
                  <p>{item.cliente}</p>
                </div>
                <strong className="shortage-quantity">
                  {missing ?? "—"}
                  <small>vol. a menos{!original && missing !== null ? "*" : ""}</small>
                </strong>
              </header>
              <StatusPill map={nfMap} value={item.tipo} />
              <p className="shortage-meta">
                {note?.praca || "Destino não informado"} · {item.data}
              </p>
              <p className="shortage-updated">Atualizado: {item.updatedAt || item.registradoEm}</p>
              <details className="field-details">
                <summary>Ver registro e atualizações</summary>
                <p>Operação: {item.conferencia}</p>
                <p>{original?.observacao || note?.observacao || "Sem observações."}</p>
                {!original && (
                  <p className="field-help">
                    * A amostra antiga não tem contagem original. Quantidade exibida conforme a
                    última contagem disponível.
                  </p>
                )}
                <ul className="discovery-history">
                  {item.discoveries?.map((d) => (
                    <li key={d.id}>
                      <strong>
                        {d.quantity} volume(s) ·{" "}
                        {d.state === "pending"
                          ? "Aguardando validação"
                          : d.state === "validated"
                            ? "Localização validada"
                            : "Não confirmada"}
                      </strong>
                      <p>{d.description}</p>
                      <small>
                        {d.actor} · {d.at}
                      </small>
                      {d.decision && (
                        <p>
                          {d.decision.reason} · {d.decision.actor} · {d.decision.at}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
              {pending ? (
                <p className="field-save-receipt">
                  <CheckCircle2 size={19} />
                  Localização informada. Aguarda validação administrativa.
                </p>
              ) : selected === item.id ? (
                <DiscoveryForm item={item} onDone={() => setSelected("")} />
              ) : (
                <Btn variant="outline" disabled={!!selected} onClick={() => setSelected(item.id)}>
                  <MapPin size={18} />
                  Encontrei um volume
                </Btn>
              )}
            </article>
          );
        })}
      </div>
      {!rows.length && (
        <EmptyState
          title="Nenhuma pendência nesta busca"
          text="Tente outra NF, cliente, data ou destino."
        />
      )}
    </>
  );
}

function DiscoveryForm({ item, onDone }: { item: Case; onDone: () => void }) {
  const { reportFound } = useOperations();
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<Evidence[]>([]);
  const [error, setError] = useState("");
  const [discard, setDiscard] = useState(false);
  const dirty = !!(quantity || description || photos.length);
  return (
    <form
      className="discovery-form"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          reportFound(item.id, Number(quantity), description, photos);
          onDone();
        } catch (error) {
          setError((error as Error).message);
        }
      }}
    >
      <UnsavedChanges dirty={dirty} />
      <label className="field-group">
        <span>Volumes localizados</span>
        <input
          autoFocus
          className="field"
          inputMode="numeric"
          type="number"
          min="1"
          step="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </label>
      <label className="field-group">
        <span>Onde encontrou? Como identificou?</span>
        <textarea
          className="field"
          rows={3}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex.: etiqueta da NF, pallet e carreta em que chegou."
        />
      </label>
      <EvidencePhotos photos={photos} onChange={setPhotos} />
      <p className="field-help">
        A contagem original será mantida. O administrativo precisa verificar antes de encerrar.
      </p>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      <Btn type="submit">Registrar localização</Btn>
      <Btn type="button" variant="ghost" onClick={() => (dirty ? setDiscard(true) : onDone())}>
        Cancelar aviso
      </Btn>
      {discard && (
        <div className="calculator-confirm">
          <p>Descartar este aviso ainda não registrado?</p>
          <Btn type="button" variant="outline" onClick={() => setDiscard(false)}>
            Continuar aviso
          </Btn>
          <Btn type="button" onClick={onDone}>
            Descartar aviso
          </Btn>
        </div>
      )}
    </form>
  );
}

export function DiscoveryReview({
  item,
  onDirty,
}: {
  item: Case;
  onDirty?: (dirty: boolean) => void;
}) {
  const { validateFound } = useOperations();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const pending = item.discoveries?.find((d) => d.state === "pending");
  useEffect(() => {
    onDirty?.(!!reason);
  }, [reason, onDirty]);
  useEffect(() => () => onDirty?.(false), [onDirty]);
  if (!item.discoveries?.length) return null;
  function decide(accepted: boolean) {
    if (!pending) return;
    try {
      validateFound(item.id, pending.id, accepted, reason);
      setReason("");
      setError("");
    } catch (error) {
      setError((error as Error).message);
    }
  }
  return (
    <section className="detail-section discovery-review">
      <h3>{pending ? "Localização aguardando validação" : "Localizações verificadas"}</h3>
      {item.discoveries.map((d) => (
        <div key={d.id} className="discovery-report">
          <strong>{d.quantity} volume(s) informado(s)</strong>
          <p>{d.description}</p>
          <small>
            {d.actor} · {d.at}
          </small>
          <EvidencePhotos photos={d.photos || []} />
          {d.decision && (
            <p>
              {d.state === "validated" ? "Validada" : "Não confirmada"}: {d.decision.reason} ·{" "}
              {d.decision.actor} · {d.decision.at}
            </p>
          )}
        </div>
      ))}
      {pending && (
        <>
          <label className="field-group">
            <span>Resultado da verificação</span>
            <textarea
              className="field"
              rows={2}
              maxLength={2000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          <div className="discovery-actions">
            <Btn onClick={() => decide(true)}>Validar localização</Btn>
            <Btn variant="outline" onClick={() => decide(false)}>
              Não confirmado
            </Btn>
          </div>
          <p className="field-help">
            Validar não altera a contagem nem encerra automaticamente a pendência.
          </p>
        </>
      )}
    </section>
  );
}
