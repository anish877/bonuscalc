import { useState, useCallback, useMemo } from "react";
import { Client, Person, Settings, TeamAllocation, BonusHistoryRecord, AllocationChange } from "@/types/bonus";
import { mockClients, mockPeople, mockSettings } from "@/data/mockData";
import { calculateAllBonuses, calculateClientBonus } from "@/lib/bonusCalculations";

// Generate initial bonus history from current data
function generateInitialHistory(
  clients: Client[],
  settings: Settings,
  people: Person[]
): BonusHistoryRecord[] {
  const history: BonusHistoryRecord[] = [];
  const calculations = calculateAllBonuses(clients, settings, people);
  
  // Generate last 6 months of history
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const periodDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const period = `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, '0')}`;
    
    calculations.forEach(calc => {
      calc.allocations.forEach(alloc => {
        history.push({
          id: `${period}-${calc.clientId}-${alloc.personId}`,
          period,
          calculatedAt: periodDate,
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
  }
  
  return history;
}

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
