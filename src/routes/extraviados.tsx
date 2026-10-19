import { meta } from "@/lib/meta";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, PackageSearch, ImageOff, Truck } from "lucide-react";
import {
  PageHeader,
  Panel,
  DataTable,
  SearchBox,
  FilterSelect,
  EmptyState,
  Btn,
} from "@/components/ui-kit";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StatusPill, extMap } from "@/components/status";
import { extraviados, type Extraviado } from "@/lib/demo-data";
export const Route = createFileRoute("/extraviados")({
  head: () => meta("Outras praças", "Conferência logística interna da filial POA."),
  component: Page,
});
function Page() {
  const [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [item, setItem] = useState<Extraviado | null>(null);
  const rows = extraviados.filter(
    (e) =>
      (!status || e.status === status) &&
      [e.nf, e.origem, e.destino, e.etiqueta].join(" ").toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <div className="eyebrow">RECEBIMENTO INDEVIDO / ENCAMINHAMENTO</div>
      <PageHeader
        title="Volumes de outras praças"
        subtitle="Mercadorias recebidas em POA com destino a outra unidade. Controle separado das faltas locais."
      />
      <div className="metrics">
        {[
          {
            label: "Identificação e registro",
            value: extraviados.filter((e) =>
              ["identificado", "aguardando_ocorrencia"].includes(e.status),
            ).length,
          },
          {
            label: "Aguardando retorno",
            value: extraviados.filter((e) => e.status === "aguardando_retorno").length,
          },
          {
            label: "Encaminhados",
            value: extraviados.filter((e) => e.status === "encaminhado").length,
          },
          {
            label: "Recebimento a confirmar",
            value: extraviados.filter((e) => e.status === "confirmacao_pendente").length,
          },
        ].map((m) => (
          <div className="metric" key={m.label}>
            <div className="metric-top">
              {m.label}
              <PackageSearch size={16} />
            </div>
            <div className="metric-value">{String(m.value).padStart(2, "0")}</div>
            <small>Registros na amostra</small>
          </div>
        ))}
      </div>
      <div className="toolbar">
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder="NF, etiqueta, origem ou destino correto"
        />
        <FilterSelect
          label="Situação"
          value={status}
          onChange={setStatus}
          options={Object.entries(extMap).map(([k, v]) => [k, v[0]])}
        />
      </div>
      <Panel flush>
        {rows.length ? (
          <DataTable
            head={[
              "Identificação / NF",
              "Origem",
              "Destino correto",
              "Volumes",
              "Retorno",
              "Situação",
              "Ação",
            ]}
          >
            {rows.map((e) => (
              <tr key={e.id}>
                <td>
                  <span className="cell-primary">{e.nf}</span>
                  <div className="cell-sub">{e.etiqueta}</div>
                </td>
                <td>{e.origem}</td>
                <td className="font-medium">{e.destino}</td>
                <td>{e.volumes}</td>
                <td>
                  {e.carretaRetorno || "A definir"}
                  <div className="cell-sub">{e.encaminhamento || "Sem saída registrada"}</div>
                </td>
                <td>
                  <StatusPill map={extMap} value={e.status} />
                </td>
                <td>
                  <button
                    className="table-link"
                    onClick={() => setItem(e)}
                    aria-label={"Detalhes de " + e.id}
                  >
                    Detalhes
                    <ArrowRight size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <EmptyState
            title="Nenhum volume encontrado"
            text="Revise a busca ou selecione outra situação."
          />
        )}
        <div className="table-footer">
          <span>{rows.length} registros · consulta demonstrativa</span>
          <span>Encaminhamento não equivale a recebimento.</span>
        </div>
      </Panel>
      <div className="info-strip mt-5">
        <Truck size={17} className="shrink-0" />
        <span>
          Códigos oficiais devem ser validados pela operação. Nenhum código, incluindo 75, é
          aplicado automaticamente. Cadastro, anexos e confirmação compartilhada de recebimento
          serão conectados na etapa 4.
        </span>
      </div>
      <Dialog
        open={!!item}
        onOpenChange={(v) => {
          if (!v) setItem(null);
        }}
      >
        <DialogContent className="!max-w-2xl !bg-white">
          <DialogTitle>Detalhe do volume · {item?.id}</DialogTitle>
          <DialogDescription>
            Registro fictício para avaliação do fluxo de outras praças.
          </DialogDescription>
          {item && (
            <>
              <div className="operation-context !mb-0">
                <div className="context-item">
                  <small>Local atual</small>
                  <strong>POA</strong>
                </div>
                <ArrowRight size={18} />
                <div className="context-item">
                  <small>Destino correto</small>
                  <strong>{item.destino}</strong>
                </div>
                <StatusPill map={extMap} value={item.status} />
              </div>
              <div className="detail-grid">
                {[
                  ["Nota fiscal", item.nf],
                  ["Identificação", item.etiqueta],
                  ["Origem", item.origem],
                  ["Volumes", item.volumes],
                  ["Cliente", "Não informado na amostra"],
                  ["Identificado por / em", "Não informado na amostra"],
                  ["Ocorrência relacionada (fictícia)", item.oc75 || "Não informada"],
                  ["Carreta de retorno", item.carretaRetorno || "A definir"],
                  ["Saída", item.encaminhamento || "Não registrada"],
                  ["Recebimento no destino", "Sem confirmação disponível"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <small>{k}</small>
                    <p>{v}</p>
                  </div>
                ))}
              </div>
              <div className="info-strip">
                <ImageOff size={17} className="shrink-0" />
                Nenhuma foto está disponível nesta demonstração. Não há evidência anexada para este
                volume.
              </div>
              <div className="flex justify-end">
                <Btn variant="outline" onClick={() => setItem(null)}>
                  Fechar detalhes
                </Btn>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
