export type ProductLine = { boxes: number; units: number };
export type ProductCount = {
  lines: ProductLine[];
  total: number;
  expected?: number;
};

export function productTotal(lines: ProductLine[]) {
  if (!lines.length) throw new Error("Adicione uma linha de cálculo.");
  let total = 0;
  for (const { boxes, units } of lines) {
    if (![boxes, units].every((n) => Number.isSafeInteger(n) && n >= 0))
      throw new Error("Use quantidades inteiras, iguais ou maiores que zero.");
    const subtotal = boxes * units;
    total += subtotal;
    if (!Number.isSafeInteger(subtotal) || !Number.isSafeInteger(total))
      throw new Error("Quantidade acima do limite de cálculo.");
  }
  return total;
}

export function productSummary(count?: ProductCount) {
  if (!count) return "não informado";
  return `${count.lines.map((l) => `${l.boxes} × ${l.units}`).join(" + ")} = ${count.total} unidades${count.expected === undefined ? "" : `; esperado informado: ${count.expected}`}`;
}

export function productError(count?: ProductCount) {
  if (!count) return "";
  try {
    if (productTotal(count.lines) !== count.total) return "Revise o cálculo de produtos.";
    if (
      count.expected !== undefined &&
      (!Number.isSafeInteger(count.expected) || count.expected < 0)
    )
      return "Revise a quantidade esperada de produtos.";
    return "";
  } catch (error) {
    return (error as Error).message;
  }
}
