// Rótulo da temporada conforme o formato do país/continente.
// - "ano": calendário no ano civil (ex.: 2026)
// - "cruzado": temporada europeia (ex.: 2026/27)

export function seasonLabel(baseYear: number, season: number, format: string): string {
  const year = baseYear + (season - 1);
  if (format === "cruzado") {
    const next = (year + 1) % 100;
    return `${year}/${next.toString().padStart(2, "0")}`;
  }
  return `${year}`;
}
