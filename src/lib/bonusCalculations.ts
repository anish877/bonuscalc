import { ClientBonusCalculation } from "@/types/bonus";

export function getPersonTotalBonus(
  personId: string,
  calculations: ClientBonusCalculation[]
): number {
  return calculations.reduce((total, calc) => {
    const allocation = calc.allocations.find((a) => a.personId === personId);
    return total + (allocation?.bonusAmount ?? 0);
  }, 0);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
