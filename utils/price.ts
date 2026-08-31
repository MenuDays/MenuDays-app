// Parseo de precios tolerante al separador decimal. La app se usa en
// LatAm/España, donde mucha gente escribe la coma como separador decimal
// ("12,50") y otra el punto ("12.50"). El back solo acepta un `number`
// con hasta 2 decimales (ver @IsNumber({ maxDecimalPlaces: 2 }) en los
// DTO), así que hay que normalizar acá ANTES de mandar: si el string se
// pasaba tal cual a Number("12,50") daba NaN y la publicación fallaba
// con "Precio inválido" aunque el precio estuviera bien.
//
// Casos que resuelve:
//   "12"          -> 12
//   "12,50"       -> 12.5
//   "12.50"       -> 12.5
//   "1.500"       -> 1500      (punto como separador de miles)
//   "1,500"       -> 1500      (coma como separador de miles)
//   "1.500,50"    -> 1500.5    (formato es-AR)
//   "1,500.50"    -> 1500.5    (formato en-US)
//   "$ 12,50"     -> 12.5      (ignora símbolo de moneda y espacios)
//   "12,555"      -> 12.56     (redondea a 2 decimales)

function looksLikeThousandsGrouping(parts: string[]): boolean {
  // "1.200" / "1,200,000": el primer grupo tiene 1..3 dígitos y todos
  // los siguientes exactamente 3. Un decimal real casi nunca cae acá
  // (nadie pone un precio con 3 decimales), y si lo hace igual el back
  // lo rechazaría por maxDecimalPlaces.
  if (parts.length < 2) return false;
  if (parts[0].length < 1 || parts[0].length > 3) return false;
  return parts.slice(1).every((p) => p.length === 3);
}

/**
 * Convierte lo que el usuario tipeó en un número. Devuelve NaN si no hay
 * ningún dígito. El resultado queda redondeado a 2 decimales.
 */
export function parsePriceInput(raw: string): number {
  if (typeof raw !== "string") return NaN;

  // Deja solo dígitos, punto, coma y signo menos.
  let s = raw.trim().replace(/[^\d.,-]/g, "");
  if (!/\d/.test(s)) return NaN;

  const negative = s.startsWith("-");
  s = s.replace(/-/g, "");

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  let decimalSep: "" | "." | "," = "";

  if (lastComma > -1 && lastDot > -1) {
    // Están los dos -> el que aparece último es el decimal, el otro es miles.
    decimalSep = lastComma > lastDot ? "," : ".";
  } else if (lastComma > -1) {
    decimalSep = looksLikeThousandsGrouping(s.split(",")) ? "" : ",";
  } else if (lastDot > -1) {
    decimalSep = looksLikeThousandsGrouping(s.split(".")) ? "" : ".";
  }

  if (decimalSep === "") {
    s = s.replace(/[.,]/g, "");
  } else {
    const thousandsSep = decimalSep === "," ? "." : ",";
    s = s.split(thousandsSep).join("");
    s = s.replace(decimalSep, ".");
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return NaN;

  const rounded = Math.round(n * 100) / 100;
  return negative ? -rounded : rounded;
}

/** true si el texto representa un precio numérico (>= 0 por defecto). */
export function isValidPriceInput(
  raw: string,
  { allowZero = true }: { allowZero?: boolean } = {}
): boolean {
  const n = parsePriceInput(raw);
  if (!Number.isFinite(n)) return false;
  if (n < 0) return false;
  if (!allowZero && n === 0) return false;
  return true;
}
