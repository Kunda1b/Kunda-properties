import { prisma } from "@kunda/database";
type RateMap = Record<string, number>;

export async function getExchangeRates(): Promise<RateMap> {
  const rates = await prisma.exchangeRate.findMany();
  return rates.reduce((acc, r) => { acc[`${r.fromCurrency}_${r.toCurrency}`] = Number(r.rate); return acc; }, {} as RateMap);
}

export function convertCurrency(amount: number, from: string, to: string, rates: RateMap): number {
  if (from === to) return amount;
  const key = `${from}_${to}`;
  if (rates[key]) return amount * rates[key];
  const toUsd = rates[`${from}_USD`] ?? 1;
  const fromUsd = rates[`USD_${to}`] ?? 1;
  return amount * toUsd * fromUsd;
}
