import { Client, Settings, ClientBonusCalculation, Person } from "@/types/bonus";

export function calculateClientBonus(
  client: Client,
  settings: Settings,
  people: Person[]
): ClientBonusCalculation {
  // Get eligible months (last 6 completed, excluding current)
  const eligibleRevenue = client.monthlyRevenue
    .filter((mr) => mr.isEligible && mr.collected > 0)
    .slice(0, 6);

  const eligibleMonths = eligibleRevenue.length;
  const totalRevenue = eligibleRevenue.reduce((sum, mr) => sum + mr.collected, 0);
  const averageMonthlyRevenue = eligibleMonths > 0 ? totalRevenue / eligibleMonths : 0;

  // Apply company expense deduction
  const netRevenuePercentage = (100 - settings.companyExpensePercentage) / 100;
  const netRevenue = averageMonthlyRevenue * netRevenuePercentage;
  const expenseDeduction = averageMonthlyRevenue - netRevenue;

  // Determine bonus percentage from slabs
  const applicableSlab = settings.bonusSlabs.find((slab) => {
    if (slab.maxRevenue === null) {
      return averageMonthlyRevenue >= slab.minRevenue;
    }
    return averageMonthlyRevenue >= slab.minRevenue && averageMonthlyRevenue <= slab.maxRevenue;
  });

  const appliedBonusPercentage = applicableSlab?.bonusPercentage ?? 0;
  const totalBonusPool = netRevenue * (appliedBonusPercentage / 100);

  // Validate team weights
  const totalWeight = client.teamAllocations.reduce((sum, ta) => sum + ta.weight, 0);
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01;

  // Calculate individual allocations
  const allocations = client.teamAllocations.map((ta) => {
    const person = people.find((p) => p.id === ta.personId);
    const bonusAmount = isWeightValid ? totalBonusPool * (ta.weight / 100) : 0;

    return {
      personId: ta.personId,
      personName: person?.name ?? "Unknown",
      weight: ta.weight,
      bonusAmount: Math.round(bonusAmount * 100) / 100,
    };
  });

  return {
    clientId: client.id,
    clientName: client.name,
    eligibleMonths,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    averageMonthlyRevenue: Math.round(averageMonthlyRevenue * 100) / 100,
    expenseDeduction: Math.round(expenseDeduction * 100) / 100,
    netRevenue: Math.round(netRevenue * 100) / 100,
    appliedBonusPercentage,
    totalBonusPool: Math.round(totalBonusPool * 100) / 100,
    allocations,
    isWeightValid,
  };
}

export function calculateAllBonuses(
  clients: Client[],
  settings: Settings,
  people: Person[]
): ClientBonusCalculation[] {
  return clients.map((client) => calculateClientBonus(client, settings, people));
}

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
