import { useQuery } from "@tanstack/react-query";
import { ratesApi } from "@/lib/api";

interface Rate {
  fromCurrency: string;
  toCurrency: string;
  rate: string;
}

export function useExchangeRates() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: () => ratesApi.getAll().then((r) => r.data.data),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });

  const rates: Rate[] = data || [];

  function convert(amount: number, from: string, to: string): number | null {
    if (from === to) return amount;
    const rate = rates.find((r) => r.fromCurrency === from && r.toCurrency === to);
    if (!rate) return null;
    return amount * Number(rate.rate);
  }

  function formatWithCurrency(amount: number, currency: string): string {
    try {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toLocaleString()}`;
    }
  }

  function getConvertedPrice(amount: number, from: string, to: string): { amount: number; formatted: string } | null {
    const converted = convert(amount, from, to);
    if (converted === null) return null;
    return { amount: Math.round(converted), formatted: formatWithCurrency(Math.round(converted), to) };
  }

  return { rates, isLoading, error, convert, getConvertedPrice, formatWithCurrency };
}
