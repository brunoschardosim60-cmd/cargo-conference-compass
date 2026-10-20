import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useOperations } from "@/lib/operation-context";
import {
  emptyOtherPlace,
  otherPlaceInput,
  otherPlaceLabels,
  type OtherPlace,
  type OtherPlaceInput,
} from "@/lib/other-places";
import { searchText } from "@/lib/operation-search";
import { Btn, DataTable, EmptyState, FilterSelect, PageHeader, Panel, SearchBox } from "./ui-kit";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { EvidencePhotos } from "./evidence-photos";
import { UnsavedChanges } from "./unsaved-changes";

export function OtherPlacesPage({ initialId = "" }: { initialId?: string }) {
  const { state } = useOperations();
  const [selected, setSelected] = useState(initialId);
  const [query, setQuery] = useState(""),
    [date, setDate] = useState(""),
    [status, setStatus] = useState("");
  const [dateKind, setDateKind] = useState("identificadoEm");
  const [dirty, setDirty] = useState(false),
    [discard, setDiscard] = useState(false);
  const rows = state.otherPlaces.filter(
    (p) =>
      (!status || p.status === status) &&
      (!date || (dateKind === "enviadoEm" ? p.enviadoEm : p.identificadoEm).startsWith(date)) &&
      searchText([p.nf, p.identificacao, p.cliente, p.destino, p.origem].join(" ")).includes(
        searchText(query),
      ),
  );
  const item = state.otherPlaces.find((p) => p.id === selected);
  function close() {
    if (dirty) setDiscard(true);
    else setSelected("");
  }
  return (
    <>
      <PageHeader
        title="Outras praças"
        subtitle="Volumes recebidos em POA que precisam seguir para outro destino."
        actions={
          <Btn onClick={() => setSelected("new")}>
            <Plus size={18} />
            Registrar volume
          </Btn>
        }
      />
      <div className="conference-search">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Buscar NF, identificação, cliente ou destino"
        />
        <details className="compact-filters">
          <summary>Filtros{date || status ? " ativos" : ""}</summary>
          <div className="filter-fields">
            <FilterSelect
              label="Situação"
              value={status}
              onChange={setStatus}
              options={Object.entries(otherPlaceLabels)}
            />
            <label className="field-group">
              <span>Pesquisar pela data de</span>
              <select
                className="field"
                value={dateKind}
                onChange={(e) => setDateKind(e.target.value)}
              >
                <option value="identificadoEm">Identificação</option>
                <option value="enviadoEm">Saída</option>
              </select>
            </label>
            <label className="field-group">
              <span>Data</span>
              <input
                className="field"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <Btn
              variant="ghost"
              onClick={() => {
                setDate("");
                setStatus("");
              }}
            >
              Limpar filtros
            </Btn>
          </div>
        </details>
      </div>
      <Panel flush>
        {rows.length ? (
          <DataTable
            head={["NF / identificação", "Destino", "Identificação / saída", "Situação", ""]}
          >
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <button className="cell-primary" onClick={() => setSelected(p.id)}>
                    {p.nf || "Sem NF"}
                  </button>
                  <div className="cell-sub">{p.identificacao || p.cliente}</div>
                </td>
                <td>
                  {p.destino}
                  <div className="cell-sub">{p.volumes} volume(s)</div>
                </td>
                <td>
                  {p.identificadoEm.replace("T", " ") || "Data não informada"}
                  <div className="cell-sub">
                    {p.enviadoEm
                      ? `Saída: ${p.enviadoEm.replace("T", " ")}`
                      : "Sem saída registrada"}
                  </div>
                </td>
                <td>
                  <span className={`other-status ${p.status === "recebido" ? "received" : ""}`}>
                    {otherPlaceLabels[p.status]}
                  </span>
                </td>
                <td>
                  <button className="table-link" onClick={() => setSelected(p.id)}>
                    Abrir
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <EmptyState
            title="Nenhum volume nesta consulta"
            text="Revise os filtros ou registre o volume identificado."
          />
        )}
      </Panel>
      <p className="active-filter-note">
        {rows.length} registros · Enviar não confirma o recebimento no destino.
      </p>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent className="other-editor-dialog">
          <DialogTitle>
            {item
              ? "Acompanhar volume"
              : selected === "new"
                ? "Registrar volume de outra praça"
                : "Registro não encontrado"}
          </DialogTitle>
          <DialogDescription>
            Identificação, encaminhamento e recebimento ficam no mesmo registro. Ambiente de teste
            local.
          </DialogDescription>
          {selected === "new" || item ? (
            <OtherPlaceEditor
              key={item ? `${item.id}-${item.version}` : "new"}
              item={item}
              onDirty={setDirty}
              onSaved={(id) => {
                setDirty(false);
                setSelected(id);
              }}
            />
          ) : (
            <EmptyState
              title="Registro indisponível neste aparelho"
              text="Os dados ainda não são sincronizados entre dispositivos."
            />
          )}
          <Btn variant="ghost" onClick={close}>
            Fechar
          </Btn>
        </DialogContent>
      </Dialog>
      <Dialog open={discard} onOpenChange={setDiscard}>
        <DialogContent>
          <DialogTitle>Há alterações não salvas</DialogTitle>
          <DialogDescription>
            Continue editando ou descarte as alterações deste formulário.
          </DialogDescription>
          <Btn variant="outline" onClick={() => setDiscard(false)}>
            Continuar editando
          </Btn>
          <Btn
            onClick={() => {
              setDiscard(false);
              setDirty(false);
              setSelected("");
            }}
          >
            Descartar alterações
          </Btn>
        </DialogContent>
      </Dialog>
    </>
  );
}

function OtherPlaceEditor({
  item,
  onDirty,
  onSaved,
}: {
  item: OtherPlace | undefined;
  onDirty: (v: boolean) => void;
  onSaved: (id: string) => void;
}) {
  const { state, saveOther } = useOperations();
  const [initial] = useState<OtherPlaceInput>(() =>
    item ? otherPlaceInput(item) : emptyOtherPlace(),
  );
  const [draft, setDraft] = useState(initial),
    [error, setError] = useState("");
  const dirty = JSON.stringify(initial) !== JSON.stringify(draft);
  useEffect(() => {
    onDirty(dirty);
  }, [dirty, onDirty]);
  useEffect(() => () => onDirty(false), [onDirty]);
  function field(key: keyof OtherPlaceInput, label: string, type = "text") {
    return (
      <label className="field-group" key={key}>
        <span>{label}</span>
        <input
          className="field"
          type={type}
          maxLength={300}
          value={String(draft[key])}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        />
      </label>
    );
  }
  const sent = ["encaminhado", "confirmacao_pendente", "recebido"].includes(draft.status);
  const events = state.history.filter((e) => e.ref === item?.id);
  return (
    <form
      className="other-editor"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        try {
          const id = saveOther(item?.id || null, draft);
          toast.success("Registro salvo neste aparelho.");
          onSaved(id);
        } catch (e) {
          setError((e as Error).message);
        }
      }}
    >
      <UnsavedChanges dirty={dirty} />
      <div className="other-form-grid">
        {field("nf", "Nota fiscal")}
        {field("identificacao", "Etiqueta / identificação disponível")}
        {field("destino", "Destino correto *")}
        {field("cliente", "Cliente")}
        {field("identificadoEm", "Data e hora da identificação *", "datetime-local")}
        {field("responsavel", "Responsável pela identificação *")}
        <label className="field-group">
          <span>Volumes físicos *</span>
          <input
            className="field"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={draft.volumes}
            onChange={(e) =>
              setDraft({ ...draft, volumes: e.target.value === "" ? 0 : Number(e.target.value) })
            }
          />
        </label>
        {field("origem", "Origem, se conhecida")}
      </div>
      <label className="field-group">
        <span>Observações</span>
        <textarea
          className="field"
          rows={2}
          maxLength={2000}
          value={draft.observacao}
          onChange={(e) => setDraft({ ...draft, observacao: e.target.value })}
        />
      </label>
      <EvidencePhotos photos={draft.photos} onChange={(photos) => setDraft({ ...draft, photos })} />
      <label className="field-group">
        <span>Situação do volume</span>
        <select
          className="field"
          value={draft.status}
          onChange={(e) => setDraft({ ...draft, status: e.target.value as OtherPlace["status"] })}
        >
          {Object.entries(otherPlaceLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {sent && (
        <div className="other-form-grid">
          {field("carreta", "Carreta / veículo de encaminhamento *")}
          {field("enviadoEm", "Data e hora de saída *", "datetime-local")}
        </div>
      )}
      {draft.status === "recebido" && (
        <div className="receipt-section">
          {field("recebidoEm", "Data e hora da confirmação *", "datetime-local")}
          {field("confirmacao", "Quem confirmou? Qual evidência ou contato? *")}
          <p>Confirmação informada manualmente pela equipe POA.</p>
        </div>
      )}
      <details className="field-details">
        <summary>Referência oficial, se houver</summary>
        {field("codigoOficial", "Número / código informado manualmente")}
        <p className="field-help">
          Preencher este campo não registra nem verifica uma ocorrência na Luft.
        </p>
      </details>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <Btn type="submit" disabled={!dirty}>
        Salvar registro
      </Btn>
      {!!item && (
        <details className="record-history">
          <summary>Histórico do volume ({events.length})</summary>
          {!events.length && <p>A amostra legada não possui eventos anteriores disponíveis.</p>}
          {events.map((e) => (
            <article key={e.id}>
              <strong>
                {e.usuario} · {e.quando}
              </strong>
              <p>{e.descricao}</p>
              <EvidencePhotos photos={e.photos || []} />
            </article>
          ))}
        </details>
      )}
    </form>
  );
}
