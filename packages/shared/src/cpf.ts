/** Remove tudo que não for dígito. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Formata 11 dígitos como "xxx.xxx.xxx-xx", preenchendo conforme o usuário digita. */
export function formatCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  const parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9)].filter(Boolean);
  let out = parts.join(".");
  if (d.length > 9) out += `-${d.slice(9, 11)}`;
  return out;
}

/** Valida os dígitos verificadores de um CPF (algoritmo padrão da Receita Federal). */
export function isValidCpf(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;

  const digits = d.split("").map(Number);
  const calcCheckDigit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += digits[i] * (length + 1 - i);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  return calcCheckDigit(9) === digits[9] && calcCheckDigit(10) === digits[10];
}

/** Formata "DDMM" a partir de uma data ISO (yyyy-mm-dd), para comparar com o login. */
export function birthDateToDDMM(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${day}${month}`;
}
