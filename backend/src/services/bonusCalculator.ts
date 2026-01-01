import { PrismaClient, MonthlyRevenue, TeamAllocation, Person, BonusSlab, Settings, Client, Override } from '@prisma/client';
import { differenceInMonths, parseISO, subMonths, format, startOfMonth, isAfter, isBefore, addMonths } from 'date-fns';

const prisma = new PrismaClient();

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
}

export interface MemberBonusAllocation {
  personId: string;
  personName: string;
  role: string;
  weight: number;
  bonusAmount: number;
}

export const calculateBonusForClientData = (
  client: Client & {
    monthlyRevenue: MonthlyRevenue[];
    teamAllocations: (TeamAllocation & { person: Person })[];
    overrides: Override[];
  },
  settings: Settings & {
    bonusSlabs: BonusSlab[];
  }
): BonusCalculationResult => {
  const now = new Date();
  const onboardingDate = new Date(client.onboardingDate);
  const monthsSinceOnboarding = differenceInMonths(now, onboardingDate);
  
  // 3. Check Eligibility
  // "if the client is less than 3 months old from the onboarding date it is not elible"
  // We use the setting minEligibilityMonths (default 3)
  if (monthsSinceOnboarding < settings.minEligibilityMonths) {
    return {
      clientId: client.id,
      clientName: client.name,
      isEligible: false,
      eligibilityReason: `Client is ${monthsSinceOnboarding} months old (Minimum ${settings.minEligibilityMonths} months required)`,
      monthsConsidered: 0,
      totalRevenue: 0,
      companyExpensePercentage: settings.companyExpensePercentage,
      netRevenue: 0,
      averageMonthlyRevenue: 0,
      bonusPercentage: 0,
      bonusPool: 0,
      allocations: [],
      consideredMonthsList: []
    };
  }

  // 4. Determine Calculation Window and Revenue
  // "count the month when 2 things happen one date wise from onbaording date and second revenue is set for that month"
  
  // Get all revenue records
  const allRevenues = client.monthlyRevenue;
  const onboardingMonthStart = startOfMonth(onboardingDate);

  // Filter for valid revenues first (Must be >= Onboarding Month)
  const validRevenues = allRevenues.filter(r => {
    const revDate = parseISO(r.month + '-01'); // YYYY-MM-01
    // valid if revDate is not before onboardingMonthStart
    return !isBefore(revDate, onboardingMonthStart);
  });

  let consideredRevenues: MonthlyRevenue[] = [];

  if (monthsSinceOnboarding < 6) {
    // Take all valid revenues
    consideredRevenues = validRevenues;
  } else {
    // Take last 6 valid revenues
    // We sort by month descending and take top 6
    consideredRevenues = validRevenues
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 6);
  }

  const totalRevenue = consideredRevenues.reduce((sum, r) => sum + r.collected, 0);
  const monthsConsideredCount = consideredRevenues.length;
  const consideredMonthsList = consideredRevenues.map(r => r.month).sort();

  if (monthsConsideredCount === 0) {
     return {
      clientId: client.id,
      clientName: client.name,
      isEligible: true,
      monthsConsidered: 0,
      totalRevenue: 0,
      companyExpensePercentage: settings.companyExpensePercentage,
      netRevenue: 0,
      averageMonthlyRevenue: 0,
      bonusPercentage: 0,
      bonusPool: 0,
      allocations: [],
      consideredMonthsList: []
    };
  }

  // 5. Calculate Average Monthly Revenue (Gross)
  // "then find the average monthly revenue"
  const averageMonthlyRevenue = monthsConsideredCount > 0 ? totalRevenue / monthsConsideredCount : 0;

  // 6. Calculate Net Revenue (Total for period)
  // "take the toal considered months revenue substarect global expense percentage"
  // Formula: Total - (Total * Expense%) = Total * (1 - Expense%)
  // Frontend Logic: Net Revenue = Total * (1 - Expense%)
  const netRevenue = totalRevenue * (1 - settings.companyExpensePercentage / 100);

  // 7. Determine Bonus Percentage from Slabs
  // "alocated bonus percentage will be bonu pool" -> Likely means look up % in slab
  // We look up based on the GROSS Average Monthly Revenue (matching frontend legacy logic)
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

  // 8. Calculate Initial Bonus Pool
  // "alocated bonus percentage will be bonu pool" -> Pool = AvgRevenue * Bonus%
  // Frontend Logic: Pool = NetRevenue * Bonus%
  const bonusPool = netRevenue * (bonusPercentage / 100);

  // 9. Distribute to Team and Apply Overrides
  // "divided to the team according to the weight"
  const allocations: MemberBonusAllocation[] = client.teamAllocations.map(alloc => {
    const initialBonus = bonusPool * (alloc.weight / 100);
    
    // Check for override
    const override = client.overrides.find(o => o.personId === alloc.personId);
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
    consideredMonthsList
  };
};

export const calculateBonusForClient = async (clientId: string): Promise<BonusCalculationResult> => {
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

  return calculateBonusForClientData(client, settings);
};
