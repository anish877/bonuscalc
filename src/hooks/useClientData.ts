import { useState, useCallback, useMemo } from "react";
import { Client, Person, Settings, TeamAllocation, BonusHistoryRecord, AllocationChange } from "@/types/bonus";
import { mockClients, mockPeople, mockSettings } from "@/data/mockData";
import { calculateAllBonuses, calculateClientBonus } from "@/lib/bonusCalculations";

// Generate 6-month payout cycle ID (e.g., "2024-H1" for Jan-Jun, "2024-H2" for Jul-Dec)
function getPayoutCycleId(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const half = month < 6 ? "H1" : "H2";
  return `${year}-${half}`;
}

function getPayoutCycleLabel(cycleId: string): string {
  const [year, half] = cycleId.split("-");
  if (half === "H1") {
    return `Jan - Jun ${year}`;
  }
  return `Jul - Dec ${year}`;
}

function getCycleStartDate(cycleId: string): Date {
  const [year, half] = cycleId.split("-");
  const month = half === "H1" ? 0 : 6;
  return new Date(parseInt(year), month, 1);
}

// Generate bonus history for 6-month payout cycles
function generateInitialHistory(
  clients: Client[],
  settings: Settings,
  people: Person[]
): BonusHistoryRecord[] {
  const history: BonusHistoryRecord[] = [];
  const calculations = calculateAllBonuses(clients, settings, people);
  
  const now = new Date();
  const currentCycle = getPayoutCycleId(now);
  
  // Generate last 3 payout cycles (current + 2 previous = 18 months of history)
  const cycles: string[] = [];
  for (let i = 0; i < 3; i++) {
    const cycleDate = new Date(now.getFullYear(), now.getMonth() - (i * 6), 1);
    const cycleId = getPayoutCycleId(cycleDate);
    if (!cycles.includes(cycleId)) {
      cycles.push(cycleId);
    }
  }
  
  cycles.forEach(cycleId => {
    const cycleStartDate = getCycleStartDate(cycleId);
    
    calculations.forEach(calc => {
      calc.allocations.forEach(alloc => {
        history.push({
          id: `${cycleId}-${calc.clientId}-${alloc.personId}`,
          period: cycleId,
          calculatedAt: cycleStartDate,
          clientId: calc.clientId,
          clientName: calc.clientName,
          personId: alloc.personId,
          personName: alloc.personName,
          weight: alloc.weight,
          bonusAmount: alloc.bonusAmount,
          totalClientBonus: calc.totalBonusPool,
          averageMonthlyRevenue: calc.averageMonthlyRevenue,
          appliedBonusPercentage: calc.appliedBonusPercentage,
        });
      });
    });
  });
  
  return history;
}

export { getPayoutCycleLabel };

export function useClientData() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [people] = useState<Person[]>(mockPeople);
  const [settings] = useState<Settings>(mockSettings);
  const [bonusHistory, setBonusHistory] = useState<BonusHistoryRecord[]>(() =>
    generateInitialHistory(mockClients, mockSettings, mockPeople)
  );
  const [allocationChanges, setAllocationChanges] = useState<AllocationChange[]>([]);

  const calculations = useMemo(
    () => calculateAllBonuses(clients, settings, people),
    [clients, settings, people]
  );

  const updateClientAllocations = useCallback(
    (clientId: string, newAllocations: TeamAllocation[]) => {
      setClients((prev) => {
        const client = prev.find((c) => c.id === clientId);
        if (!client) return prev;

        // Record changes
        const changes: AllocationChange[] = [];
        newAllocations.forEach((newAlloc) => {
          const oldAlloc = client.teamAllocations.find(
            (a) => a.personId === newAlloc.personId
          );
          if (oldAlloc && oldAlloc.weight !== newAlloc.weight) {
            changes.push({
              id: `change-${Date.now()}-${newAlloc.personId}`,
              clientId,
              personId: newAlloc.personId,
              previousWeight: oldAlloc.weight,
              newWeight: newAlloc.weight,
              changedAt: new Date(),
              changedBy: "Current User",
            });
          }
        });

        if (changes.length > 0) {
          setAllocationChanges((prev) => [...changes, ...prev]);
        }

        return prev.map((c) =>
          c.id === clientId ? { ...c, teamAllocations: newAllocations } : c
        );
      });
    },
    []
  );

  const addTeamMember = useCallback(
    (clientId: string, personId: string, weight: number) => {
      setClients((prev) =>
        prev.map((c) => {
          if (c.id !== clientId) return c;
          if (c.teamAllocations.some((a) => a.personId === personId)) return c;
          return {
            ...c,
            teamAllocations: [...c.teamAllocations, { personId, weight }],
          };
        })
      );
    },
    []
  );

  const removeTeamMember = useCallback((clientId: string, personId: string) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        return {
          ...c,
          teamAllocations: c.teamAllocations.filter(
            (a) => a.personId !== personId
          ),
        };
      })
    );
  }, []);

  const getClientById = useCallback(
    (clientId: string) => clients.find((c) => c.id === clientId),
    [clients]
  );

  const getPersonBonusHistory = useCallback(
    (personId: string) => {
      return bonusHistory
        .filter((h) => h.personId === personId)
        .sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime());
    },
    [bonusHistory]
  );

  const getClientBonusHistory = useCallback(
    (clientId: string) => {
      return bonusHistory
        .filter((h) => h.clientId === clientId)
        .sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime());
    },
    [bonusHistory]
  );

  return {
    clients,
    people,
    settings,
    calculations,
    bonusHistory,
    allocationChanges,
    updateClientAllocations,
    addTeamMember,
    removeTeamMember,
    getClientById,
    getPersonBonusHistory,
    getClientBonusHistory,
  };
}
