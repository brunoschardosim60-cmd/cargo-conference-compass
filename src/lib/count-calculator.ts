/** Arithmetic for physical counts. No dynamic code execution or implicit rounding. */
export function calculateCount(expression: string): number {
  const normalized = expression
    .replace(/\s/g, "")
    .replaceAll(",", ".")
    .replaceAll("×", "*")
    .replaceAll("÷", "/");
  if (
    !normalized ||
    normalized.length > 120 ||
    !/^\d+(?:\.\d+)?(?:[+*/-]\d+(?:\.\d+)?)*$/.test(normalized)
  )
    throw new Error("Complete a conta. Exemplo: 12 + 12 + 6.");
  const tokens = normalized.match(/\d+(?:\.\d+)?|[+*/-]/g)!;
  if (tokens.some((token, index) => index % 2 === 0 && Number(token) > Number.MAX_SAFE_INTEGER))
    throw new Error("O número é grande demais. Revise a conta.");
  let sum = 0,
    term = Number(tokens[0]),
    sign = 1;
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i],
      value = Number(tokens[i + 1]);
    if (op === "*") term *= value;
    else if (op === "/") {
      if (value === 0) throw new Error("Não é possível dividir por zero.");
      term /= value;
    } else {
      sum += sign * term;
      term = value;
      sign = op === "+" ? 1 : -1;
    }
    if (
      !Number.isFinite(term) ||
      Math.abs(term) > Number.MAX_SAFE_INTEGER ||
      Math.abs(sum) > Number.MAX_SAFE_INTEGER
    )
      throw new Error("O resultado é grande demais. Revise a conta.");
  }
  const result = sum + sign * term;
  if (!Number.isFinite(result) || Math.abs(result) > Number.MAX_SAFE_INTEGER)
    throw new Error("O resultado é grande demais. Revise a conta.");
  return result;
}
