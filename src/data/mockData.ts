import { Client, Person, Settings, Override } from "@/types/bonus";

// Generate last 8 months for demo
const generateMonths = (count: number): string[] => {
  const months: string[] = [];
  const now = new Date();
  for (let i = 1; i <= count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
};

const months = generateMonths(8);

export const mockPeople: Person[] = [
  { id: "p1", name: "Sarah Chen", email: "sarah@company.com", role: "Account Manager", avatarUrl: "", defaultBonusWeight: 10 },
  { id: "p2", name: "Marcus Johnson", email: "marcus@company.com", role: "Senior Developer", avatarUrl: "", defaultBonusWeight: 20 },
  { id: "p3", name: "Emily Rodriguez", email: "emily@company.com", role: "Project Lead", avatarUrl: "", defaultBonusWeight: 25 },
  { id: "p4", name: "David Kim", email: "david@company.com", role: "Developer", avatarUrl: "", defaultBonusWeight: 15 },
  { id: "p5", name: "Lisa Thompson", email: "lisa@company.com", role: "Designer", avatarUrl: "", defaultBonusWeight: 15 },
];

export const mockClients: Client[] = [
  {
    id: "c1",
    name: "TechCorp Industries",
    onboardingDate: new Date("2024-01-15"),
    status: "Active",
    monthlyRevenue: [
      { month: months[0], collected: 8500, isEligible: true },
      { month: months[1], collected: 9200, isEligible: true },
      { month: months[2], collected: 7800, isEligible: true },
      { month: months[3], collected: 8900, isEligible: true },
      { month: months[4], collected: 9500, isEligible: true },
      { month: months[5], collected: 8200, isEligible: true },
    ],
    teamAllocations: [
      { personId: "p1", weight: 40 },
      { personId: "p2", weight: 35 },
      { personId: "p4", weight: 25 },
    ],
  },
  {
    id: "c2",
    name: "Global Finance Ltd",
    onboardingDate: new Date("2024-03-01"),
    status: "Active",
    monthlyRevenue: [
      { month: months[0], collected: 4200, isEligible: true },
      { month: months[1], collected: 4500, isEligible: true },
      { month: months[2], collected: 3800, isEligible: true },
      { month: months[3], collected: 4100, isEligible: true },
      { month: months[4], collected: 4800, isEligible: true },
      { month: months[5], collected: 4300, isEligible: true },
    ],
    teamAllocations: [
      { personId: "p3", weight: 50 },
      { personId: "p5", weight: 50 },
    ],
  },
  {
    id: "c3",
    name: "Innovate Solutions",
    onboardingDate: new Date("2024-06-01"),
    status: "Active",
    monthlyRevenue: [
      { month: months[0], collected: 12500, isEligible: true },
      { month: months[1], collected: 11800, isEligible: true },
      { month: months[2], collected: 13200, isEligible: true },
      { month: months[3], collected: 12000, isEligible: true },
      { month: months[4], collected: 14500, isEligible: true },
      { month: months[5], collected: 13800, isEligible: true },
    ],
    teamAllocations: [
      { personId: "p1", weight: 30 },
      { personId: "p2", weight: 30 },
      { personId: "p3", weight: 20 },
      { personId: "p4", weight: 20 },
    ],
  },
  {
    id: "c4",
    name: "StartUp Labs",
    onboardingDate: new Date("2024-08-15"),
    status: "Inactive",
    monthlyRevenue: [
      { month: months[0], collected: 2800, isEligible: true },
      { month: months[1], collected: 3200, isEligible: true },
      { month: months[2], collected: 2500, isEligible: true },
      { month: months[3], collected: 3000, isEligible: true },
    ],
    teamAllocations: [
      { personId: "p2", weight: 60 },
      { personId: "p5", weight: 30 },
    ],
  },
  {
    id: "c5",
    name: "Enterprise Co",
    onboardingDate: new Date("2024-02-01"),
    status: "Active",
    monthlyRevenue: [
      { month: months[0], collected: 6800, isEligible: true },
      { month: months[1], collected: 7200, isEligible: true },
      { month: months[2], collected: 6500, isEligible: true },
      { month: months[3], collected: 7000, isEligible: true },
      { month: months[4], collected: 7500, isEligible: true },
      { month: months[5], collected: 6900, isEligible: true },
    ],
    teamAllocations: [
      { personId: "p1", weight: 35 },
      { personId: "p3", weight: 35 },
      { personId: "p4", weight: 30 },
    ],
  },
];

export const mockSettings: Settings = {
  companyExpensePercentage: 40,
  bonusPoolMinPercentage: 10,
  bonusPoolMaxPercentage: 20,
  payoutFrequency: "Quarterly",
  minEligibilityMonths: 3,
  bonusSlabs: [
    { id: "slab1", minRevenue: 0, maxRevenue: 5000, bonusPercentage: 20 },
    { id: "slab2", minRevenue: 5001, maxRevenue: null, bonusPercentage: 10 },
  ],
};

export const mockOverrides: Override[] = [];
