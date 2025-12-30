export interface Client {
  id: string;
  name: string;
  onboardingDate: Date;
  monthlyRevenue: MonthlyRevenue[];
  teamAllocations: TeamAllocation[];
}

export interface MonthlyRevenue {
  month: string; // YYYY-MM format
  collected: number;
  isEligible: boolean;
}

export interface TeamAllocation {
  personId: string;
  weight: number; // 0-100 percentage
}

export interface Person {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export interface BonusSlab {
  id: string;
  minRevenue: number;
  maxRevenue: number | null;
  bonusPercentage: number;
}

export interface Settings {
  companyExpensePercentage: number;
  bonusSlabs: BonusSlab[];
}

export interface ClientBonusCalculation {
  clientId: string;
  clientName: string;
  eligibleMonths: number;
  totalRevenue: number;
  averageMonthlyRevenue: number;
  expenseDeduction: number;
  netRevenue: number;
  appliedBonusPercentage: number;
  totalBonusPool: number;
  allocations: IndividualAllocation[];
  isWeightValid: boolean;
}

export interface IndividualAllocation {
  personId: string;
  personName: string;
  weight: number;
  bonusAmount: number;
}

export interface Override {
  id: string;
  clientId: string;
  personId?: string;
  originalAmount: number;
  overrideAmount: number;
  reason: string;
  approvedBy: string;
  approvalDate: Date;
}
