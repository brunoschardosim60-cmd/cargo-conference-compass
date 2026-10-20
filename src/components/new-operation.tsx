import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Trash2, FileUp, ArrowRight, ArrowLeft, Info } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Btn } from "./ui-kit";
import { useOperations } from "@/lib/operation-context";
import { toast } from "sonner";
const blank = () => ({ nf: "", pedido: "", destinatario: "", previstos: 1, praca: "", pallet: "" });
export function NewOperation({
  open,
  onOpenChange,
  initialMethod = "manual",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialMethod?: "manual" | "pdf";
}) {
  const { addOperation } = useOperations();
  const navigate = useNavigate();
  const [step, setStep] = useState(1),
    [method, setMethod] = useState(initialMethod),
    [error, setError] = useState("");
  const [data, setData] = useState({
      origem: "",
      placa: "",
      motorista: "",
      doca: "",
      responsavel: "",
      chegada: "",
    }),
    [rows, setRows] = useState([blank()]);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (step === 1) {
      if (![data.origem, data.placa, data.motorista].every((v) => v.trim())) {
        setError("Informe origem, placa e motorista antes de continuar.");
        return;
      }
      setStep(2);
      return;
    }
    if (
      rows.some(
        (n) =>
          !n.nf.trim() ||
          !n.destinatario.trim() ||
          !Number.isSafeInteger(n.previstos) ||
          n.previstos <= 0,
      )
    ) {
      setError("Preencha NF, destinatário e volumes inteiros maiores que zero em todas as linhas.");
      return;
    }
    if (new Set(rows.map((n) => n.nf.trim())).size !== rows.length) {
      setError("NF repetida nesta relação. Revise as linhas antes de confirmar.");
      return;
    }
    let id: string;
    try {
      id = addOperation(
        {
          ...data,
          placa: data.placa.trim().toUpperCase(),
          responsavel: data.responsavel || "Não atribuído",
        },
        rows.map((n) => ({ ...n, nf: n.nf.trim() })),
      );
    } catch (error) {
      setError((error as Error).message);
      return;
    }
    onOpenChange(false);
    setStep(1);
    setRows([blank()]);
    setData({ origem: "", placa: "", motorista: "", doca: "", responsavel: "", chegada: "" });
    toast.success("Operação criada neste aparelho de teste.");
    navigate({ to: "/conferencias/$id", params: { id } });
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-3xl !max-h-[90vh] overflow-y-auto !bg-white">
        <DialogTitle>
          {initialMethod === "pdf"
            ? "Importar relação de conferência"
            : "Nova operação de recebimento"}
        </DialogTitle>
        <DialogDescription>
          Cadastro de teste salvo neste navegador · não sincroniza entre aparelhos.
        </DialogDescription>
        {initialMethod === "pdf" && (
          <div className="pdf-workflow">
            <h3>Do PDF à tela do conferente</h3>
            <ol>
              <li>
                <strong>1. Enviar o PDF</strong>
                <span>Relação completa da carreta, com todas as páginas.</span>
              </li>
              <li>
                <strong>2. Revisar a extração</strong>
                <span>Conferir clientes, notas e volumes. Corrigir campos duvidosos.</span>
              </li>
              <li>
                <strong>3. Liberar para conferência</strong>
                <span>O conferente abre a carga no celular e escolhe o cliente.</span>
              </li>
            </ol>
            <p className="info-strip">
              <Info size={17} />A leitura do PDF ainda não está disponível. O próximo passo é
              implementar a extração com revisão humana e conectar o armazenamento protegido.
            </p>
          </div>
        )}
        {initialMethod !== "pdf" && (
          <div className="segment-tabs">
            <span className={step === 1 ? "text-primary font-semibold" : "muted"}>
              01 · Identificar carreta
            </span>
            <ArrowRight size={14} />
            <span className={step === 2 ? "text-primary font-semibold" : "muted"}>
              02 · Revisar relação
            </span>
          </div>
        )}
        {initialMethod !== "pdf" && (
          <form onSubmit={submit} className="space-y-5">
            {step === 1 ? (
              <div className="wizard-grid">
                {(
                  [
                    ["origem", "Origem da carga", "Ex.: Itajaí / SC"],
                    ["placa", "Placa do veículo", "Ex.: ABC1D23"],
                    ["motorista", "Motorista", "Nome do motorista"],
                    ["chegada", "Data e hora de chegada", ""],
                    ["doca", "Doca", "Ex.: D04"],
                    ["responsavel", "Conferente responsável", "Nome do conferente"],
                  ] as const
                ).map(([k, l, p]) => (
                  <label className="field-group" key={k}>
                    <span>
                      {l}
                      {["origem", "placa", "motorista"].includes(k) ? " *" : ""}
                    </span>
                    <input
                      required={["origem", "placa", "motorista"].includes(k)}
                      type={k === "chegada" ? "datetime-local" : "text"}
                      maxLength={100}
                      className="field"
                      placeholder={p}
                      value={data[k]}
                      onChange={(e) => setData({ ...data, [k]: e.target.value })}
                    />
                  </label>
                ))}
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Btn
                    variant={method === "manual" ? "default" : "outline"}
                    onClick={() => setMethod("manual")}
                  >
                    Digitação manual
                  </Btn>
                  <Btn
                    variant={method === "pdf" ? "default" : "outline"}
                    onClick={() => setMethod("pdf")}
                  >
                    <FileUp size={14} />
                    Importar PDF
                  </Btn>
                </div>
                {method === "pdf" ? (
                  <div className="rounded-lg border border-dashed p-7 text-center">
                    <FileUp size={28} className="mx-auto text-muted-foreground" />
                    <h3 className="mt-3 font-medium">Importação com revisão humana</h3>
                    <p className="muted mt-2 leading-relaxed">
                      O fluxo previsto receberá PDFs de várias páginas, preservará o original e
                      sinalizará campos ambíguos antes da confirmação.
                    </p>
                    <p className="info-strip mt-4 text-left">
                      <Info size={16} className="shrink-0" />
                      Extração e armazenamento protegido serão conectados na etapa 4. Nesta versão,
                      use a digitação manual com dados de teste.
                    </p>
                    <Btn variant="outline" className="mt-4" onClick={() => setMethod("manual")}>
                      Digitar relação de teste
                    </Btn>
                  </div>
                ) : (
                  <>
                    <div className="info-strip">
                      Revise a relação antes de liberar. Campos ausentes podem ficar em branco; NF,
                      destinatário e volumes são obrigatórios para este cadastro manual.
                    </div>
                    <div className="space-y-3">
                      {rows.map((r, i) => (
                        <div className="rounded-md border p-3" key={i}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="eyebrow !mb-0">
                              NOTA {String(i + 1).padStart(2, "0")}
                            </span>
                            <button
                              type="button"
                              aria-label={"Remover nota " + (i + 1)}
                              disabled={rows.length === 1}
                              onClick={() => setRows(rows.filter((_, j) => j !== i))}
                              className="icon-button disabled:opacity-30"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {(
                              [
                                ["nf", "Nota fiscal *"],
                                ["pedido", "Pedido"],
                                ["destinatario", "Destinatário *"],
                                ["previstos", "Volumes *"],
                                ["praca", "Praça"],
                                ["pallet", "Pallet"],
                              ] as const
                            ).map(([k, l]) => (
                              <label className="field-group" key={k}>
                                <span>{l}</span>
                                <input
                                  className="field"
                                  required={["nf", "destinatario", "previstos"].includes(k)}
                                  aria-label={l + " da linha " + (i + 1)}
                                  type={k === "previstos" ? "number" : "text"}
                                  min={k === "previstos" ? 1 : undefined}
                                  step={1}
                                  value={r[k]}
                                  onChange={(e) =>
                                    setRows(
                                      rows.map((n, j) =>
                                        j === i
                                          ? {
                                              ...n,
                                              [k]:
                                                k === "previstos"
                                                  ? Number(e.target.value)
                                                  : e.target.value,
                                            }
                                          : n,
                                      ),
                                    )
                                  }
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Btn variant="outline" onClick={() => setRows([...rows, blank()])}>
                      <Plus size={14} />
                      Adicionar nota
                    </Btn>
                    <p className="muted">
                      {rows.length} nota(s) · {rows.reduce((a, n) => a + n.previstos, 0)} volumes
                      previstos
                    </p>
                  </>
                )}
              </>
            )}
            {error && (
              <p role="alert" className="error-text">
                {error}
              </p>
            )}
            <div className="flex justify-between border-t pt-4">
              <Btn variant="ghost" onClick={() => (step === 1 ? onOpenChange(false) : setStep(1))}>
                <ArrowLeft size={14} />
                {step === 1 ? "Cancelar" : "Voltar"}
              </Btn>
              <Btn type="submit" disabled={step === 2 && method === "pdf"}>
                {step === 1 ? "Revisar relação" : "Confirmar operação de teste"}
                <ArrowRight size={14} />
              </Btn>
            </div>
          </form>
        )}
        {initialMethod === "pdf" && (
          <Btn variant="outline" onClick={() => onOpenChange(false)}>
            Entendi
          </Btn>
        )}
      </DialogContent>
    </Dialog>
  );
}
