import { PrismaClient, Prisma, MonthlyRevenue, TeamAllocation, Person, BonusSlab, Settings, Client, Override, HalfYearBonus, QuarterPayout } from '@prisma/client';
import { differenceInMonths, parseISO, subMonths, format, startOfMonth, isAfter, isBefore, addMonths, getYear, getMonth } from 'date-fns';

const prisma = new PrismaClient();

export type HalfYear = 'H1' | 'H2';

export interface BonusCalculationResult {
  clientId: string;
  clientName: string;
  isEligible: boolean;
  eligibilityReason?: string;
  monthsConsidered: number;
  totalRevenue: number;
  companyExpensePercentage: number;
  netRevenue: number;
  averageMonthlyRevenue: number;
  bonusPercentage: number;
  bonusPool: number;
  allocations: MemberBonusAllocation[];
  consideredMonthsList: string[]; // YYYY-MM
  period: string; // YYYY-H1 or YYYY-H2
}

export interface MemberBonusAllocation {
  personId: string;
  personName: string;
  role: string;
  weight: number;
  bonusAmount: number;
}

export const getRevenueMonthsForPeriod = (year: number, halfYear: HalfYear): string[] => {
  const months = halfYear === 'H1' 
    ? ['01', '02', '03', '04', '05', '06']
    : ['07', '08', '09', '10', '11', '12'];
  return months.map(m => `${year}-${m}`);
};

export const calculateBonusForClientData = (
  client: Client & {
    monthlyRevenue: MonthlyRevenue[];
    teamAllocations: (TeamAllocation & { person: Person })[];
    overrides: Override[];
  },
  settings: Settings & {
    bonusSlabs: BonusSlab[];
  },
  year: number,
  halfYear: HalfYear
): BonusCalculationResult => {
  const period = `${year}-${halfYear}`;
  
  // 1. Determine Period Start Date
  // H1 starts Jan 1, H2 starts Jul 1
  const periodStart = new Date(year, halfYear === 'H1' ? 0 : 6, 1);
  const onboardingDate = new Date(client.onboardingDate);
  
  // 2. Eligibility Check (Strict)
  // Client must be onboarded BEFORE or AT the start of the period to be eligible for the FULL half-year block.
  // If they join in Feb, they miss Jan, so they are not eligible for H1 (according to business logic: "Q1+Q2 -> incomplete (client not in Q1)").
  // We use startOfMonth to ignore time parts.
  const onboardingMonthStart = startOfMonth(onboardingDate);
  const periodMonthStart = startOfMonth(periodStart);

  if (isAfter(onboardingMonthStart, periodMonthStart)) {
     return {
      clientId: client.id,
      clientName: client.name,
      isEligible: false,
      eligibilityReason: `Client onboarded on ${format(onboardingDate, 'yyyy-MM-dd')}, after start of ${halfYear} (${format(periodStart, 'yyyy-MM-dd')}). Must be active for full half-year.`,
      monthsConsidered: 0,
      totalRevenue: 0,
      companyExpensePercentage: settings.companyExpensePercentage,
      netRevenue: 0,
      averageMonthlyRevenue: 0,
      bonusPercentage: 0,
      bonusPool: 0,
      allocations: [],
      consideredMonthsList: [],
      period
    };
  }

  // 3. Get Revenue for the Fixed Window
  const targetMonths = getRevenueMonthsForPeriod(year, halfYear);
  const consideredRevenues = client.monthlyRevenue.filter(r => targetMonths.includes(r.month));
  
  // 4. Sum Total Revenue
  const totalRevenue = consideredRevenues.reduce((sum, r) => sum + r.collected, 0);
  const monthsConsideredCount = consideredRevenues.length;
  const consideredMonthsList = consideredRevenues.map(r => r.month).sort();

  // 5. Calculate Average Monthly Revenue (For Slab Lookup Only)
  // We use the full 6 months for average, even if data is missing (it treats missing as 0), 
  // because eligibility requires full period presence.
  const averageMonthlyRevenue = totalRevenue / 6;

  // 6. Calculate Net Revenue (Total based)
  // Formula: Total - (Total * Expense%) = Total * (1 - Expense%)
  const netRevenue = totalRevenue * (1 - settings.companyExpensePercentage / 100);

  // 7. Determine Bonus Percentage from Slabs
  // Using Average Monthly Revenue for lookup to maintain compatibility with existing slab configurations (usually monthly based).
  let bonusPercentage = 0;
  
  // Sort slabs by minRevenue ascending
  const sortedSlabs = settings.bonusSlabs.sort((a, b) => a.minRevenue - b.minRevenue);
  
  for (const slab of sortedSlabs) {
    if (averageMonthlyRevenue >= slab.minRevenue) {
      if (!slab.maxRevenue || averageMonthlyRevenue <= slab.maxRevenue) {
        bonusPercentage = slab.bonusPercentage;
        break; 
      }
    }
  }

  // 8. Calculate Bonus Pool
  // Pool = NetRevenue * Bonus%
  const bonusPool = netRevenue * (bonusPercentage / 100);

  // 9. Distribute to Team and Apply Overrides
  const allocations: MemberBonusAllocation[] = client.teamAllocations.map(alloc => {
    const initialBonus = bonusPool * (alloc.weight / 100);
    
    // Check for override
    const override = client.overrides.find(o => o.personId === alloc.personId);
    // TODO: Filter overrides by period? Currently overrides are global or recent? 
    // Schema doesn't link override to period. Assuming override is "current active". 
    // Ideally overrides should be linked to a period. For now, we use the existing override table.
    const finalBonus = override ? override.overrideAmount : initialBonus;

    return {
      personId: alloc.personId,
      personName: alloc.person.name,
      role: alloc.person.role,
      weight: alloc.weight,
      bonusAmount: finalBonus
    };
  });

  return {
    clientId: client.id,
    clientName: client.name,
    isEligible: true,
    monthsConsidered: monthsConsideredCount,
    totalRevenue,
    companyExpensePercentage: settings.companyExpensePercentage,
    netRevenue,
    averageMonthlyRevenue,
    bonusPercentage,
    bonusPool,
    allocations,
    consideredMonthsList,
    period
  };
};

export const calculateBonusForClient = async (clientId: string): Promise<BonusCalculationResult> => {
  // Defaults to CURRENT Half Year based on Today
  const now = new Date();
  const year = getYear(now);
  const month = getMonth(now); // 0-11
  const halfYear: HalfYear = month < 6 ? 'H1' : 'H2';

  return calculateBonusForPeriod(clientId, year, halfYear);
};

export const calculateBonusForPeriod = async (clientId: string, year: number, halfYear: HalfYear): Promise<BonusCalculationResult> => {
  // 1. Fetch Client and related data
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      monthlyRevenue: true,
      teamAllocations: {
        include: {
          person: true
        }
      },
      overrides: true
    }
  });

  if (!client) {
    throw new Error('Client not found');
  }

  // 2. Fetch Settings
  const settings = await prisma.settings.findFirst({
    include: {
      bonusSlabs: true
    }
  });

  if (!settings) {
    throw new Error('Settings not configured');
  }

  return calculateBonusForClientData(client, settings, year, halfYear);
};

export const finalizeBonusForPeriod = async (clientId: string, year: number, halfYear: HalfYear) => {
  const calculation = await calculateBonusForPeriod(clientId, year, halfYear);
  
  if (!calculation.isEligible) {
    throw new Error(`Client is not eligible for bonus in ${year}-${halfYear}: ${calculation.eligibilityReason}`);
  }

  // Create HalfYearBonus Record
  const bonusRecord = await prisma.halfYearBonus.create({
    data: {
      clientId,
      period: `${year}-${halfYear}`,
      totalRevenue: calculation.totalRevenue,
      calculatedBonus: calculation.bonusPool,
      allocations: calculation.allocations as unknown as Prisma.InputJsonArray, // Save allocations snapshot
      isFinalized: true
    }
  });

  // Schedule Payouts
  // H1 (Jan-Jun) -> Payouts: Q3 (Sep 30), Q4 (Dec 31)
  // H2 (Jul-Dec) -> Payouts: Q1 Next Year (Mar 31), Q2 Next Year (Jun 30)
  
  const payout1Date = halfYear === 'H1' 
    ? new Date(year, 8, 30) // Sep 30 (Month 8 is Sep)
    : new Date(year + 1, 2, 31); // Mar 31 Next Year

  const payout2Date = halfYear === 'H1'
    ? new Date(year, 11, 31) // Dec 31
    : new Date(year + 1, 5, 30); // Jun 30 Next Year

  const payout1Period = halfYear === 'H1' ? `${year}-Q3` : `${year + 1}-Q1`;
  const payout2Period = halfYear === 'H1' ? `${year}-Q4` : `${year + 1}-Q2`;

  const payoutAmount = calculation.bonusPool / 2;

  await prisma.quarterPayout.createMany({
    data: [
      {
        halfYearBonusId: bonusRecord.id,
        payoutPeriod: payout1Period,
        amount: payoutAmount,
        dueDate: payout1Date,
        status: 'PENDING'
      },
      {
        halfYearBonusId: bonusRecord.id,
        payoutPeriod: payout2Period,
        amount: payoutAmount,
        dueDate: payout2Date,
        status: 'PENDING'
      }
    ]
  });

  return bonusRecord;
};
