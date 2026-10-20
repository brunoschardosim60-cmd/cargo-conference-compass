import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateCount } from "@/lib/count-calculator";
import { CountCalculator } from "@/components/count-calculator";

afterEach(cleanup);
describe("Calculadora de volumes", () => {
  it.each([
    ["12 + 12 + 6", 30],
    ["4 × 12 + 1", 49],
    ["50 - 1", 49],
    ["24 ÷ 2 + 3", 15],
    ["1,5 * 2", 3],
    ["0", 0],
  ] as const)("calcula %s sem arredondar", (expression, result) =>
    expect(calculateCount(expression)).toBe(result),
  );
  it.each([
    "1/0",
    "12+",
    "alert(1)",
    "1e3",
    "9007199254740993-9007199254740992",
    "9007199254740991*2/2",
  ])("rejeita conta inválida ou insegura %s", (expression) =>
    expect(() => calculateCount(expression)).toThrow(),
  );
  it("bloqueia resultados fracionários e negativos e explica divisão por zero", () => {
    render(<CountCalculator onApply={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Calculadora" }));
    for (const expression of ["1/2", "1-2", "1/0"]) {
      fireEvent.change(screen.getByLabelText("Conta"), { target: { value: expression } });
      expect(screen.getByRole("button", { name: /Usar/ })).toBeDisabled();
    }
    expect(screen.getByText("Não é possível dividir por zero.")).toBeInTheDocument();
  });
  it("permite somar pelo teclado de toque, corrigir e aplicar explicitamente", () => {
    const apply = vi.fn();
    render(<CountCalculator onApply={apply} />);
    fireEvent.click(screen.getByRole("button", { name: "Calculadora" }));
    for (const key of ["4", "+", "6", "Apagar", "5"])
      fireEvent.click(screen.getByRole("button", { name: key }));
    expect(apply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Usar 9 volumes" }));
    expect(apply).toHaveBeenCalledWith(9, "4+5");
  });
});
