import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Copy, Save, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, DataTable, SearchBox, FilterSelect, Btn, EmptyState } from "./ui-kit";
import { StatusPill, ocMap, nfMap } from "./status";
import { useOperations } from "@/lib/operation-context";
import type { Case } from "@/lib/operation-model";
import type { OcStatus } from "@/lib/demo-data";
import { UnsavedChanges } from "./unsaved-changes";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
export function CaseCenter({ tower = false }: { tower?: boolean }) {
  const { state } = useOperations();
  const [dirty, setDirty] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [revision, setRevision] = useState(0);
  function changeView(action: () => void) {
    if (dirty) setPendingAction(() => action);
    else action();
  }
  const [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [operation, setOperation] = useState(""),
    [date, setDate] = useState(""),
    [scope, setScope] = useState("abertas"),
    [selected, setSelected] = useState("");
  const base = state.cases;
  const rows = base.filter(
    (c) =>
      (scope !== "abertas" || !["resolvida", "cancelada"].includes(c.status)) &&
      (!status || c.status === status) &&
      (!operation || c.conferencia === operation) &&
      (!date || c.data === date) &&
      [c.id, c.nf, c.cliente, c.registradoPor, c.responsavel || ""]
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  const current = rows.find((c) => c.id === selected) || rows[0];
  return (
    <>
      <UnsavedChanges dirty={dirty} />
      <div className="eyebrow">
        {tower ? "TORRE / ACOMPANHAMENTO" : "ADMINISTRATIVO / TRATAMENTO"}
      </div>
      <PageHeader
        title={tower ? "Acompanhamento da torre" : "Central de pendências"}
        subtitle={
          tower
            ? "Acompanhe localizações, retornos e confirmações sem perder o histórico do caso."
            : "Da divergência à resolução: contexto da carga, responsável e próxima providência."
        }
      />
      <div className="segment-tabs">
        {(
          [
            ["abertas", "Em aberto"],
            ["todas", "Todos os registros"],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            aria-pressed={scope === v}
            onClick={() => {
              if (scope !== v) changeView(() => setScope(v));
            }}
          >
            {l}
            <span>
              {
                base.filter((c) => v === "todas" || !["resolvida", "cancelada"].includes(c.status))
                  .length
              }
            </span>
          </button>
        ))}
        <span className="ml-auto muted">
          {
            base.filter((c) => !c.responsavel && !["resolvida", "cancelada"].includes(c.status))
              .length
          }{" "}
          sem responsável
        </span>
      </div>
      <div className="toolbar">
        <SearchBox
          value={q}
          onChange={(v) => changeView(() => setQ(v))}
          placeholder="Buscar NF, cliente, responsável ou pendência"
        />
        <FilterSelect
          label="Operação"
          value={operation}
          onChange={(v) => changeView(() => setOperation(v))}
          options={state.operations.map((o) => [o.id, o.id])}
        />
        <FilterSelect
          label="Situação"
          value={status}
          onChange={(v) => changeView(() => setStatus(v))}
          options={Object.entries(ocMap).map(([k, v]) => [k, v[0]])}
        />
        <input
          className="field !w-auto !py-2 text-xs"
          aria-label="Data do registro"
          title="Data do registro"
          type="date"
          value={date}
          onChange={(e) => {
            const value = e.target.value;
            changeView(() => setDate(value));
          }}
        />
        {(q || status || operation || date) && (
          <Btn
            variant="ghost"
            onClick={() =>
              changeView(() => {
                setQ("");
                setStatus("");
                setOperation("");
                setDate("");
              })
            }
          >
            Limpar
          </Btn>
        )}
      </div>
      <div className="case-layout">
        <Panel
          title={tower ? "Fila de acompanhamento" : "Pendências da operação"}
          actions={<span className="muted">{rows.length} registros</span>}
          flush
        >
          {!rows.length ? (
            <EmptyState
              title="Nenhuma pendência encontrada"
              text="Nenhum registro corresponde aos filtros. Consulte todos os registros para ver casos encerrados."
            />
          ) : (
            <DataTable head={["NF / cliente", "Divergência", "Situação / responsável"]}>
              {rows.map((c) => (
                <tr key={c.id} className={current?.id === c.id ? "note-selected" : ""}>
                  <td>
                    <button
                      className="cell-primary"
                      aria-pressed={current?.id === c.id}
                      onClick={() => {
                        if (current?.id !== c.id) changeView(() => setSelected(c.id));
                      }}
                    >
                      NF {c.nf}
                    </button>
                    <div className="cell-sub">{c.cliente}</div>
                    <div className="cell-sub">{c.conferencia}</div>
                  </td>
                  <td>
                    <StatusPill map={nfMap} value={c.tipo} />
                    <div className="cell-sub">{c.registradoEm}</div>
                  </td>
                  <td>
                    <StatusPill map={ocMap} value={c.status} />
                    <div className="cell-sub">{c.responsavel || "Sem responsável"}</div>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
          <div className="table-footer">
            <span>Registro interno · ambiente de demonstração</span>
          </div>
        </Panel>
        {current && (
          <CaseDetail
            key={`${current.id}-${revision}`}
            item={current}
            tower={tower}
            onDirty={setDirty}
          />
        )}
      </div>
      <Dialog
        open={!!pendingAction}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Há um tratamento não salvo</DialogTitle>
          <DialogDescription>
            Salve as providências antes de trocar de registro ou alterar os filtros, ou descarte o
            rascunho.
          </DialogDescription>
          <div className="flex justify-end gap-2">
            <Btn variant="outline" onClick={() => setPendingAction(null)}>
              Continuar editando
            </Btn>
            <Btn
              onClick={() => {
                pendingAction?.();
                setPendingAction(null);
                setDirty(false);
                setRevision((v) => v + 1);
              }}
            >
              Descartar e continuar
            </Btn>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
function CaseDetail({
  item,
  tower,
  onDirty,
}: {
  item: Case;
  tower: boolean;
  onDirty: (dirty: boolean) => void;
}) {
  const { state, updateCase } = useOperations();
  const n = state.notes.find(
    (n) =>
      n.conferencia === item.conferencia && (item.noteId ? n.id === item.noteId : n.nf === item.nf),
  );
  const original = item.registroOriginal;
  const events = state.history.filter((e) => e.ref === item.id || (e.notaId && e.notaId === n?.id));
  const [owner, setOwner] = useState(item.responsavel || ""),
    [status, setStatus] = useState<OcStatus>(item.status),
    [action, setAction] = useState(item.providencia || ""),
    [code, setCode] = useState(item.codigoOficial || ""),
    [reason, setReason] = useState(item.justificativa || ""),
    [receipt, setReceipt] = useState(false),
    [error, setError] = useState("");
  const closed = ["resolvida", "cancelada"].includes(item.status);
  const dirty =
    !closed &&
    (owner !== (item.responsavel || "") ||
      status !== item.status ||
      action !== (item.providencia || "") ||
      code !== (item.codigoOficial || "") ||
      reason !== (item.justificativa || "") ||
      receipt);
  useEffect(() => {
    onDirty(dirty);
  }, [dirty, onDirty]);
  useEffect(() => () => onDirty(false), [onDirty]);
  function save() {
    setError("");
    if (!owner.trim() || !action.trim()) {
      setError("Informe o responsável e a providência tomada.");
      return;
    }
    if ((status === "resolvida" || status === "cancelada") && !reason.trim()) {
      setError("O encerramento exige uma justificativa.");
      return;
    }
    if (status === "resolvida" && tower && !receipt) {
      setError("Confirme a verificação do recebimento antes de resolver.");
      return;
    }
    updateCase(item.id, {
      responsavel: owner,
      status,
      providencia: action,
      codigoOficial: code.trim(),
      justificativa: reason,
      proximaAcao: status === "resolvida" ? "Encerrada com justificativa" : action,
      ...(receipt ? { recebimentoConfirmado: true } : {}),
    });
    setCode(code.trim());
    setReceipt(false);
    toast.success("Tratamento registrado nesta sessão de demonstração.");
  }
  const draft =
    "Assunto: Divergência de recebimento · NF " +
    item.nf +
    " · POA\n\nOperação: " +
    item.conferencia +
    "\nCliente: " +
    item.cliente +
    "\nTipo: " +
    nfMap[item.tipo][0] +
    "\nVolumes previstos: " +
    (n?.previstos ?? "não informado") +
    "\nVolumes encontrados: " +
    (n?.encontrados ?? "não informado") +
    "\nConferente: " +
    item.registradoPor +
    "\nObservações: " +
    (n?.observacao || "não informadas") +
    "\nConta da última contagem: " +
    (n?.calculo || "não utilizada") +
    "\nRegistro original: " +
    (original
      ? `${original.encontrados} de ${original.previstos} volumes; ${nfMap[original.status][0]}; ${original.observacao}`
      : "não disponível na amostra") +
    "\nProvidência: " +
    (action || "não informada") +
    "\nReferência oficial informada manualmente: " +
    (code || "não informada") +
    "\n\nRASCUNHO DE DEMONSTRAÇÃO — revisar antes de comunicar.";
  return (
    <section className="panel case-detail">
      <header>
        <div className="eyebrow">DETALHE DA PENDÊNCIA</div>
        <h2>NF {item.nf}</h2>
        <p className="muted">{item.cliente}</p>
        <div className="mt-3">
          <StatusPill map={ocMap} value={item.status} />
        </div>
      </header>
      <div className="detail-section">
        <h3>Última contagem da nota</h3>
        <div className="detail-grid">
          <div>
            <small>Conferente</small>
            <p>{n?.registradoPor || item.registradoPor}</p>
          </div>
          <div>
            <small>Volumes previstos / encontrados</small>
            <p>
              {n?.previstos ?? "—"} / {n?.encontrados ?? "—"}
            </p>
          </div>
          <div>
            <small>Diferença</small>
            <p className="text-danger">
              {n?.encontrados != null ? n.encontrados - n.previstos : "Não disponível"}
            </p>
          </div>
          <div>
            <small>Registrada em</small>
            <p>{n?.registradoEm || item.registradoEm}</p>
          </div>
        </div>
        <p className="muted mt-3">{n?.observacao || "Sem observação detalhada na amostra."}</p>
        {n?.calculo && (
          <p className="audit-calculation">
            Conta utilizada: {n.calculo} = {n.encontrados}
          </p>
        )}
        {n?.status === "conferida" && !closed && (
          <p className="info-strip mt-3">
            A contagem foi corrigida para sem divergência. A pendência aguarda análise e
            encerramento com justificativa.
          </p>
        )}
        <p className="muted mt-2">Evidências: nenhum arquivo disponível nesta demonstração.</p>
        {state.operations.some((o) => o.id === item.conferencia) && (
          <Link
            to="/conferencias/$id"
            params={{ id: item.conferencia }}
            className="table-link mt-3"
          >
            Consultar operação <ArrowUpRight size={13} />
          </Link>
        )}
      </div>
      <div className="detail-section">
        <h3>Registro que abriu a pendência</h3>
        {original ? (
          <>
            <p>
              {original.encontrados} encontrados / {original.previstos} previstos ·{" "}
              {nfMap[original.status][0]}
            </p>
            <p className="muted mt-2">{original.observacao}</p>
            {original.calculo && (
              <p className="audit-calculation">Conta original: {original.calculo}</p>
            )}
            <p className="muted mt-2">
              {original.usuario} · {original.quando}
            </p>
          </>
        ) : (
          <p className="muted">
            O registro original não está disponível nesta amostra antiga. Novas pendências preservam
            a contagem e a observação de abertura.
          </p>
        )}
      </div>
      <div className="detail-section space-y-3">
        <h3>Providências e acompanhamento</h3>
        <label className="field-group">
          <span>Responsável</span>
          <select
            disabled={closed}
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="field"
          >
            <option value="">Selecionar responsável</option>
            {["Ana P.", "Bruno T.", "Torre"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="field-group">
          <span>Situação interna</span>
          <select
            disabled={closed}
            className="field"
            value={status}
            onChange={(e) => setStatus(e.target.value as OcStatus)}
          >
            {Object.entries(ocMap).map(([k, v]) => (
              <option key={k} value={k}>
                {v[0]}
              </option>
            ))}
          </select>
        </label>
        <label className="field-group">
          <span>Providência tomada / próxima ação</span>
          <textarea
            disabled={closed}
            rows={3}
            maxLength={2000}
            className="field"
            placeholder="Descreva a consulta, busca ou contato realizado…"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
        </label>
      </div>
      <div className="detail-section space-y-3">
        <h3>Registro oficial · informação manual</h3>
        <p className="muted leading-relaxed">
          Informe a referência somente após o lançamento no sistema oficial. Este campo não verifica
          nem cria uma ocorrência na Luft.
        </p>
        <label className="field-group">
          <span>Número ou código informado</span>
          <input
            disabled={closed}
            className="field"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Não informado"
            maxLength={100}
          />
        </label>
        {(status === "resolvida" || status === "cancelada") && (
          <>
            <label className="field-group">
              <span>Justificativa do encerramento *</span>
              <textarea
                disabled={closed}
                className="field"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={2000}
                placeholder="O que foi localizado ou confirmado?"
              />
            </label>
            {tower && status === "resolvida" && !closed && (
              <label className="flex items-start gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={receipt}
                  onChange={(e) => setReceipt(e.target.checked)}
                />
                Confirmei o recebimento ou a resolução com a operação.
              </label>
            )}
          </>
        )}
      </div>
      <div className="case-actions">
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mt-4">
          {!closed && (
            <Btn onClick={save} disabled={!dirty}>
              <Save size={14} />
              Salvar tratamento
            </Btn>
          )}
          <Btn
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(draft);
                toast.success("Rascunho copiado. Revise antes de enviar.");
              } catch {
                toast.error("Não foi possível copiar. Use o texto do rascunho abaixo.");
              }
            }}
          >
            <Copy size={14} />
            Copiar rascunho
          </Btn>
        </div>
        {dirty && (
          <p className="muted mt-3" aria-live="polite">
            Tratamento não salvo · salve antes de sair ou mudar de registro.
          </p>
        )}
        <details className="mt-4">
          <summary className="text-xs text-info cursor-pointer">
            Visualizar rascunho da comunicação
          </summary>
          <textarea
            className="field mt-3 text-xs"
            rows={9}
            readOnly
            value={draft}
            aria-label="Rascunho de comunicação"
          />
        </details>
        {closed && (
          <p className="info-strip mt-4">
            <CheckCircle2 size={16} className="shrink-0" />
            Registro encerrado. Justificativa:{" "}
            {item.justificativa || "Não informada no exemplo original."}
          </p>
        )}
        {item.recebimentoConfirmado && (
          <p className="info-strip mt-3">
            Verificação do recebimento ou resolução confirmada manualmente pela torre.
          </p>
        )}
        <details className="mt-4 case-audit">
          <summary>Histórico desta pendência ({events.length})</summary>
          {events.length ? (
            <ol>
              {events.map((e) => (
                <li key={e.id}>
                  <strong>
                    {e.usuario} · {e.quando}
                  </strong>
                  <p>{e.descricao}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted mt-2">Nenhuma alteração registrada nesta sessão.</p>
          )}
        </details>
        <p className="muted mt-4 flex gap-2 leading-relaxed">
          <AlertTriangle size={14} className="shrink-0" />
          Nenhum e-mail é enviado pela aplicação.
        </p>
      </div>
    </section>
  );
}
