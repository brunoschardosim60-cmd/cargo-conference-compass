import { useRef, useState } from "react";
import { Calculator } from "lucide-react";
import { calculateCount } from "@/lib/count-calculator";
import { Btn } from "./ui-kit";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";

export function CountCalculator({
  onApply,
}: {
  onApply: (count: number, expression: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [expression, setExpression] = useState("");
  const [error, setError] = useState("");
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
            Somar os volumes
          </DialogTitle>
          <DialogDescription>
            Ex.: 12 + 12 + 6. Multiplicação e divisão são calculadas primeiro.
          </DialogDescription>
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
            Usar {usable ? result : "o total"} volumes
          </Btn>
          <p className="calculator-hint">Preenche a contagem. Você ainda precisa salvar a nota.</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
