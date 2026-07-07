// Sistema de moedas por país/continente. Valores internos do jogo são em EUR (€).
// Convertemos para exibição conforme a moeda escolhida.

export type Currency = { code: string; symbol: string; name: string; rate: number };

// rate = quantos <moeda> equivalem a 1 EUR
export const CURRENCIES: Record<string, Currency> = {
  EUR: { code: "EUR", symbol: "€", name: "Euro", rate: 1 },
  BRL: { code: "BRL", symbol: "R$", name: "Real", rate: 6.2 },
  GBP: { code: "GBP", symbol: "£", name: "Libra", rate: 0.85 },
  USD: { code: "USD", symbol: "$", name: "Dólar", rate: 1.08 },
  ARS: { code: "ARS", symbol: "AR$", name: "Peso Arg.", rate: 1050 },
};

// País -> moeda padrão
export const COUNTRY_CURRENCY: Record<string, string> = {
  Brasil: "BRL",
  Inglaterra: "GBP",
  Espanha: "EUR",
  Itália: "EUR",
  Alemanha: "EUR",
  França: "EUR",
  Argentina: "ARS",
  Portugal: "EUR",
  Holanda: "EUR",
  Uruguai: "USD",
  México: "USD",
  Bélgica: "EUR",
  Colômbia: "USD",
  Croácia: "EUR",
};

export function currencyForCountry(pais?: string): string {
  if (!pais) return "EUR";
  return COUNTRY_CURRENCY[pais] ?? "EUR";
}

// Continente por país (para força relativa: Europa costuma ser mais forte)
export const COUNTRY_CONTINENT: Record<string, string> = {
  Brasil: "América", Argentina: "América", Uruguai: "América", México: "América", Colômbia: "América",
  Inglaterra: "Europa", Espanha: "Europa", Itália: "Europa",
  Alemanha: "Europa", França: "Europa", Portugal: "Europa", Holanda: "Europa", Bélgica: "Europa", Croácia: "Europa",
};

// Bônus de nível por continente (Europa mais forte)
export function continentBonus(pais?: string): number {
  const cont = pais ? COUNTRY_CONTINENT[pais] : undefined;
  if (cont === "Europa") return 4;
  if (cont === "América") return 0;
  return 0;
}

export function convert(valueEur: number, to: string): number {
  const c = CURRENCIES[to] ?? CURRENCIES.EUR;
  return valueEur * c.rate;
}

// Formata um valor (em EUR internamente) na moeda escolhida, com K/M/B
export function fmtMoney(valueEur: number, code = "EUR"): string {
  const c = CURRENCIES[code] ?? CURRENCIES.EUR;
  const v = valueEur * c.rate;
  const abs = Math.abs(v);
  let s: string;
  if (abs >= 1_000_000_000) s = `${(v / 1_000_000_000).toFixed(2)}B`;
  else if (abs >= 1_000_000) s = `${(v / 1_000_000).toFixed(1)}M`;
  else if (abs >= 1_000) s = `${(v / 1_000).toFixed(0)}K`;
  else s = `${Math.round(v)}`;
  return `${c.symbol}${s}`;
}
