/** Tarjeta para historias de Instagram y TikTok (9:16), el formato que se comparte en redes. */
export const TARJETA = { ancho: 1080, alto: 1920 } as const;

/**
 * Parte `texto` en líneas que caben en `ancho` según `medir` (por ejemplo `ctx.measureText(s).width`).
 * Corta por palabras; una palabra que no cabe sola se corta por letras. Si sobran líneas,
 * la última termina en "…" sin pasarse del ancho.
 */
export function cortarLineas(texto: string, ancho: number, medir: (s: string) => number, maxLineas: number): string[] {
  const lineas: string[] = [];
  let actual = '';
  for (const palabra of texto.trim().split(/\s+/).filter(Boolean)) {
    const junto = actual ? `${actual} ${palabra}` : palabra;
    if (medir(junto) <= ancho) {
      actual = junto;
      continue;
    }
    if (actual) lineas.push(actual);
    actual = '';
    for (const letra of palabra) {
      if (actual && medir(actual + letra) > ancho) {
        lineas.push(actual);
        actual = '';
      }
      actual += letra;
    }
  }
  if (actual) lineas.push(actual);
  if (lineas.length <= maxLineas) return lineas;

  let ultima = lineas[maxLineas - 1];
  while (ultima && medir(`${ultima}…`) > ancho) ultima = ultima.slice(0, -1);
  return [...lineas.slice(0, maxLineas - 1), `${ultima.trimEnd()}…`];
}

/** El tamaño de letra más grande (≤ `maxPx`) con el que `texto` cabe en `ancho`; el ancho crece lineal con el tamaño. */
export function tamanoQueCabe(texto: string, ancho: number, medir: (s: string, px: number) => number, maxPx: number): number {
  const medido = medir(texto, maxPx);
  return medido <= ancho ? maxPx : Math.floor((maxPx * ancho) / medido);
}
