export interface Client {
  id: string;
  name: string;
  onboardingDate: Date;
  status: 'Active' | 'Inactive';
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
  defaultBonusWeight?: number;
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
  bonusPoolMinPercentage: number;
  bonusPoolMaxPercentage: number;
  payoutFrequency: string;
  minEligibilityMonths: number;
  bonusSlabs: BonusSlab[];
}

export interface ClientBonusCalculation {
  clientId: string;
  clientName: string;
  isEligible: boolean;
  eligibilityReason?: string;
  eligibleMonths: number;
  totalRevenue: number;
  averageMonthlyRevenue: number;
  expenseDeduction: number;
  netRevenue: number;
  appliedBonusPercentage: number;
  totalBonusPool: number;
  allocations: IndividualAllocation[];
  isWeightValid: boolean;
  period?: string; // YYYY-H1 or YYYY-H2
  consideredMonthsList?: string[]; // List of YYYY-MM months
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

export interface BonusHistoryRecord {
  id: string;
  period: string; // YYYY-MM format for the calculation period
  calculatedAt: Date;
  clientId: string;
  clientName: string;
  personId: string;
  personName: string;
  weight: number;
  bonusAmount: number;
  totalClientBonus: number;
  averageMonthlyRevenue: number;
  appliedBonusPercentage: number;
}

export type HalfYear = 'H1' | 'H2';

export interface QuarterPayout {
  id: string;
  halfYearBonusId: string;
  payoutPeriod: string; // e.g. "2024-Q3"
  amount: number;
  status: 'PENDING' | 'PAID';
  dueDate: string; // Date string
}

export interface HalfYearBonus {
  id: string;
  clientId: string;
  period: string; // e.g. "2024-H1"
  totalRevenue: number;
  calculatedBonus: number;
  isFinalized: boolean;
  payouts: QuarterPayout[];
  createdAt: string;
}

export interface AllocationChange {
  id: string;
  clientId: string;
  personId: string;
  previousWeight: number;
  newWeight: number;
  changedAt: Date;
  changedBy: string;
}
