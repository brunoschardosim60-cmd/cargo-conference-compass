import { useRef, useState } from "react";
import { Calculator, Plus, X } from "lucide-react";
import { calculateCount } from "@/lib/count-calculator";
import { productTotal, type ProductCount } from "@/lib/product-count";
import { Btn } from "./ui-kit";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";

export function CountCalculator({
  onApply,
  onApplyProducts,
  expectedVolumes,
  products,
}: {
  onApply: (count: number, expression: string) => void;
  onApplyProducts?: (count: ProductCount) => void;
  expectedVolumes?: number;
  products?: ProductCount | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [expression, setExpression] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"volumes" | "products">("volumes");
  const [lines, setLines] = useState(
    products?.lines.map((l, id) => ({ id, boxes: String(l.boxes), units: String(l.units) })) || [
      { id: 0, boxes: "", units: "" },
    ],
  );
  const nextLine = useRef(lines.length);
  const [expected, setExpected] = useState(products?.expected?.toString() || "");
  const [confirmProducts, setConfirmProducts] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  let calculationError = "";
  let result: number | null = null;
  try {
    result = calculateCount(expression);
  } catch (e) {
    calculationError = (e as Error).message;
  }
  const usable = result !== null && Number.isSafeInteger(result) && result >= 0;
  let productResult: number | null = null;
  let productIssue = "";
  try {
    if (lines.some((l) => l.boxes === "" || l.units === ""))
      throw new Error("Preencha caixas e unidades em cada linha.");
    productResult = productTotal(
      lines.map((l) => ({ boxes: Number(l.boxes), units: Number(l.units) })),
    );
    if (expected !== "" && (!Number.isSafeInteger(Number(expected)) || Number(expected) < 0))
      throw new Error("Informe um total esperado inteiro e igual ou maior que zero.");
  } catch (e) {
    productIssue = (e as Error).message;
  }
  function update(value: string) {
    setExpression(value.slice(0, 120));
    setError("");
  }
  function apply() {
    try {
      const count = calculateCount(expression);
      if (!Number.isSafeInteger(count) || count < 0)
        throw new Error("Volumes precisam ser uma quantidade inteira, igual ou maior que zero.");
      onApply(count, expression.trim());
      setOpen(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <Btn
        type="button"
        variant="outline"
        className="calculator-trigger"
        onClick={(e) => {
          triggerRef.current = e.currentTarget;
          setOpen(true);
        }}
      >
        <Calculator size={19} />
        Calculadora
      </Btn>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="count-calculator"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            headingRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            triggerRef.current?.focus();
          }}
        >
          <DialogTitle ref={headingRef} tabIndex={-1}>
            Calculadora de conferência
          </DialogTitle>
          <DialogDescription>
            Escolha o que está contando. Produtos e volumes são registros separados.
          </DialogDescription>
          <div className="field-tabs calculator-mode" aria-label="O que calcular">
            <button
              type="button"
              aria-pressed={mode === "volumes"}
              onClick={() => {
                setMode("volumes");
                setConfirmProducts(false);
              }}
            >
              Volumes físicos
            </button>
            <button
              type="button"
              aria-pressed={mode === "products"}
              onClick={() => setMode("products")}
            >
              Produtos nas caixas
            </button>
          </div>
          {mode === "products" ? (
            <div className="product-calculator">
              {lines.map((line, index) => (
                <div className="product-line" key={line.id}>
                  <label className="field-group">
                    <span>Caixas {index + 1}</span>
                    <input
                      className="field"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      value={line.boxes}
                      onChange={(e) => {
                        setConfirmProducts(false);
                        setLines(
                          lines.map((l) =>
                            l.id === line.id ? { ...l, boxes: e.target.value } : l,
                          ),
                        );
                      }}
                    />
                  </label>
                  <span aria-hidden="true">×</span>
                  <label className="field-group">
                    <span>Unid. por caixa {index + 1}</span>
                    <input
                      className="field"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      value={line.units}
                      onChange={(e) => {
                        setConfirmProducts(false);
                        setLines(
                          lines.map((l) =>
                            l.id === line.id ? { ...l, units: e.target.value } : l,
                          ),
                        );
                      }}
                    />
                  </label>
                  <button
                    className="icon-button"
                    type="button"
                    disabled={lines.length === 1}
                    aria-label={`Remover linha ${index + 1}`}
                    onClick={() => {
                      setConfirmProducts(false);
                      setLines(lines.filter((l) => l.id !== line.id));
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
              <Btn
                type="button"
                variant="outline"
                onClick={() => {
                  setConfirmProducts(false);
                  setLines([...lines, { id: nextLine.current++, boxes: "", units: "" }]);
                }}
              >
                <Plus size={17} />
                Adicionar caixas diferentes
              </Btn>
              <output className="calculator-result" aria-live="polite">
                <span>Total de produtos</span>
                <strong>
                  {productResult?.toLocaleString("pt-BR") ?? "—"} <small>un.</small>
                </strong>
              </output>
              <label className="field-group">
                <span>Unidades esperadas · opcional</span>
                <input
                  className="field"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={expected}
                  placeholder="Informe a quantidade de produtos"
                  onChange={(e) => {
                    setExpected(e.target.value);
                    setConfirmProducts(false);
                  }}
                />
              </label>
              {expected !== "" && productResult !== null && !productIssue && (
                <p className="calculator-comparison" role="status">
                  Diferença: {productResult - Number(expected)} unidades de produto
                </p>
              )}
              {productIssue && <p className="calculator-hint">{productIssue}</p>}
              {confirmProducts ? (
                <div className="calculator-confirm">
                  <p>
                    Guardar <strong>{productResult} unidades de produto</strong> nesta nota? A
                    contagem de volumes e a situação continuarão como estão.
                  </p>
                  <Btn
                    type="button"
                    disabled={!!productIssue || productResult === null}
                    onClick={() => {
                      if (productResult === null || productIssue) return;
                      onApplyProducts?.({
                        lines: lines.map((l) => ({
                          boxes: Number(l.boxes),
                          units: Number(l.units),
                        })),
                        total: productResult,
                        ...(expected === "" ? {} : { expected: Number(expected) }),
                      });
                      setConfirmProducts(false);
                      setOpen(false);
                    }}
                  >
                    Confirmar uso do resultado
                  </Btn>
                  <Btn type="button" variant="ghost" onClick={() => setConfirmProducts(false)}>
                    Voltar ao cálculo
                  </Btn>
                </div>
              ) : (
                <Btn
                  type="button"
                  className="calculator-apply"
                  disabled={!onApplyProducts || !!productIssue || productResult === null}
                  onClick={() => setConfirmProducts(true)}
                >
                  Usar no campo de produtos
                </Btn>
              )}
              <p className="calculator-hint">
                Este cálculo é opcional e não confirma a conferência da NF.
              </p>
            </div>
          ) : (
            <>
              <label className="field-group">
                <span>Conta</span>
                <input
                  autoComplete="off"
                  className="field calculator-expression"
                  value={expression}
                  maxLength={120}
                  placeholder="12 + 12 + 6"
                  onChange={(e) => update(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      apply();
                    }
                  }}
                />
              </label>
              <output className="calculator-result" aria-live="polite">
                <span>Total</span>
                <strong>
                  {result === null
                    ? "—"
                    : result.toLocaleString("pt-BR", { maximumFractionDigits: 10 })}
                </strong>
              </output>
              {usable && expectedVolumes !== undefined && (
                <p className="calculator-comparison">
                  Relação: {expectedVolumes} volumes · diferença: {result! - expectedVolumes}
                </p>
              )}
              <div className="calculator-keys">
                {[
                  "7",
                  "8",
                  "9",
                  "+",
                  "4",
                  "5",
                  "6",
                  "−",
                  "1",
                  "2",
                  "3",
                  "×",
                  "Limpar",
                  "0",
                  "Apagar",
                  "÷",
                ].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      update(
                        key === "Limpar"
                          ? ""
                          : key === "Apagar"
                            ? expression.slice(0, -1)
                            : expression + (key === "−" ? "-" : key),
                      )
                    }
                  >
                    {key}
                  </button>
                ))}
              </div>
              {error && (
                <p role="alert" className="error-text">
                  {error}
                </p>
              )}
              {expression && calculationError && !error && (
                <p className="calculator-hint" role="status">
                  {calculationError}
                </p>
              )}
              {result !== null && !usable && !error && (
                <p className="error-text">O total precisa ser inteiro e igual ou maior que zero.</p>
              )}
              <Btn type="button" className="calculator-apply" disabled={!usable} onClick={apply}>
                {usable ? `Usar ${result} volumes` : "Usar resultado"}
              </Btn>
              <p className="calculator-hint">
                Preenche a contagem. Você ainda precisa salvar a nota.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
