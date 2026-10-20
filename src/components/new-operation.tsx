import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Trash2, FileUp, ArrowRight, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Btn } from "./ui-kit";
import { useOperations } from "@/lib/operation-context";
import { toast } from "sonner";
import { PdfImportDialog } from "./pdf-import-dialog";
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
    [pdf, setPdf] = useState(false),
    [error, setError] = useState("");
  const [data, setData] = useState({
    origem: "",
    placa: "",
    motorista: "",
    doca: "",
    responsavel: "",
    chegada: "",
  });
  const [rows, setRows] = useState([blank()]);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (step === 1) {
      if (![data.origem, data.placa, data.motorista].every((v) => v.trim())) {
        setError("Informe origem, placa e motorista.");
        return;
      }
      setStep(2);
      return;
    }
    try {
      const id = addOperation(
        {
          ...data,
          placa: data.placa.trim().toUpperCase(),
          responsavel: data.responsavel || "Não atribuído",
        },
        rows,
      );
      onOpenChange(false);
      setStep(1);
      setRows([blank()]);
      setData({ origem: "", placa: "", motorista: "", doca: "", responsavel: "", chegada: "" });
      toast.success("Operação criada neste aparelho.");
      navigate({ to: "/conferencias/$id", params: { id } });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (initialMethod === "pdf" || pdf)
    return (
      <PdfImportDialog
        open={open}
        onOpenChange={(v) => {
          if (!v) setPdf(false);
          onOpenChange(v);
        }}
      />
    );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-3xl !max-h-[90vh] overflow-y-auto !bg-white">
        <DialogTitle>Nova operação de recebimento</DialogTitle>
        <DialogDescription>
          Cadastro manual salvo neste navegador. Para ler uma relação, escolha Importar PDF.
        </DialogDescription>
        <div className="segment-tabs">
          <span>01 · Identificar carreta</span>
          <ArrowRight size={14} />
          <span>02 · Revisar relação</span>
        </div>
        <form onSubmit={submit} className="space-y-5">
          {step === 1 ? (
            <>
              <Btn variant="outline" onClick={() => setPdf(true)}>
                <FileUp size={16} />
                Importar PDF
              </Btn>
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
                ).map(([k, label, placeholder]) => (
                  <label className="field-group" key={k}>
                    <span>
                      {label}
                      {["origem", "placa", "motorista"].includes(k) ? " *" : ""}
                    </span>
                    <input
                      required={["origem", "placa", "motorista"].includes(k)}
                      type={k === "chegada" ? "datetime-local" : "text"}
                      maxLength={150}
                      className="field"
                      placeholder={placeholder}
                      value={data[k]}
                      onChange={(e) => setData({ ...data, [k]: e.target.value })}
                    />
                  </label>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="info-strip">
                Revise NF, destinatário e volumes físicos. Campos que não constam na relação podem
                ficar vazios.
              </p>
              <div className="space-y-3">
                {rows.map((row, index) => (
                  <div className="rounded-md border p-3" key={index}>
                    <div className="flex items-center justify-between mb-3">
                      <span>Nota {index + 1}</span>
                      <button
                        className="icon-button"
                        type="button"
                        aria-label={`Remover nota ${index + 1}`}
                        disabled={rows.length === 1}
                        onClick={() => setRows(rows.filter((_, i) => i !== index))}
                      >
                        <Trash2 size={16} />
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
                      ).map(([k, label]) => (
                        <label className="field-group" key={k}>
                          <span>{label}</span>
                          <input
                            className="field"
                            required={["nf", "destinatario", "previstos"].includes(k)}
                            aria-label={`${label} da linha ${index + 1}`}
                            type={k === "previstos" ? "number" : "text"}
                            min={k === "previstos" ? 1 : undefined}
                            step={1}
                            value={row[k]}
                            onChange={(e) =>
                              setRows(
                                rows.map((r, i) =>
                                  i === index
                                    ? {
                                        ...r,
                                        [k]:
                                          k === "previstos"
                                            ? Number(e.target.value)
                                            : e.target.value,
                                      }
                                    : r,
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
                <Plus size={16} />
                Adicionar nota
              </Btn>
              <p>
                {rows.length} nota(s) · {rows.reduce((n, r) => n + r.previstos, 0)} volumes
                previstos
              </p>
            </>
          )}
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          <div className="flex justify-between border-t pt-4">
            <Btn variant="ghost" onClick={() => (step === 1 ? onOpenChange(false) : setStep(1))}>
              <ArrowLeft size={16} />
              {step === 1 ? "Cancelar" : "Voltar"}
            </Btn>
            <Btn type="submit">
              {step === 1 ? "Revisar relação" : "Confirmar operação"}
              <ArrowRight size={16} />
            </Btn>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
