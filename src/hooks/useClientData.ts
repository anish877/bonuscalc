import { useState, useCallback, useMemo, useEffect } from "react";
import { Client, Person, Settings, TeamAllocation, BonusHistoryRecord, AllocationChange, Override, ClientBonusCalculation } from "@/types/bonus";

const defaultSettings: Settings = {
  companyExpensePercentage: 0,
  bonusPoolMinPercentage: 0,
  bonusPoolMaxPercentage: 0,
  payoutFrequency: "Quarterly",
  minEligibilityMonths: 3,
  bonusSlabs: [],
};

// Generate 6-month payout cycle ID (e.g., "2024-H1" for Jan-Jun, "2024-H2" for Jul-Dec)
function getPayoutCycleId(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const half = month < 6 ? "H1" : "H2";
  return `${year}-${half}`;
}

function getPayoutCycleLabel(cycleId: string): string {
  const parts = cycleId.split("-");
  if (parts.length === 2) {
    const [year, suffix] = parts;
    
    // Handle H1/H2 legacy format
    if (suffix === "H1") return `Jan - Jun ${year}`;
    if (suffix === "H2") return `Jul - Dec ${year}`;
    
    // Handle YYYY-MM format
    const month = parseInt(suffix);
    if (!isNaN(month) && month >= 1 && month <= 12) {
      const date = new Date(parseInt(year), month - 1);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
  }
  
  return cycleId;
}

function getCycleStartDate(cycleId: string): Date {
  const parts = cycleId.split("-");
  if (parts.length === 2) {
    const [yearStr, suffix] = parts;
    const year = parseInt(yearStr);
    
    if (suffix === "H1") return new Date(year, 0, 1); // Jan 1
    if (suffix === "H2") return new Date(year, 6, 1); // Jul 1
    
    const month = parseInt(suffix);
    if (!isNaN(month) && month >= 1 && month <= 12) {
      return new Date(year, month - 1, 1);
    }
  }
  return new Date(); // Fallback
}

export { getPayoutCycleLabel, getCycleStartDate };

export function useClientData() {
  const [clients, setClients] = useState<Client[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [bonusHistory, setBonusHistory] = useState<BonusHistoryRecord[]>([]);
  const [allocationChanges, setAllocationChanges] = useState<AllocationChange[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [calculations, setCalculations] = useState<ClientBonusCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const fetchCalculations = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bonus/calculations`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        const mappedCalculations: ClientBonusCalculation[] = data.map((d: {
          clientId: string;
          clientName: string;
          isEligible: boolean;
          eligibilityReason?: string;
          monthsConsidered: number;
          totalRevenue: number;
          averageMonthlyRevenue: number;
          netRevenue: number;
          bonusPercentage: number;
          bonusPool: number;
          allocations: { personId: string; personName: string; weight: number; bonusAmount: number }[];
        }) => ({
          clientId: d.clientId,
          clientName: d.clientName,
          isEligible: d.isEligible,
          eligibilityReason: d.eligibilityReason,
          eligibleMonths: d.monthsConsidered,
          totalRevenue: d.totalRevenue,
          averageMonthlyRevenue: d.averageMonthlyRevenue,
          expenseDeduction: d.averageMonthlyRevenue - d.netRevenue,
          netRevenue: d.netRevenue,
          appliedBonusPercentage: d.bonusPercentage,
          totalBonusPool: d.bonusPool,
          allocations: d.allocations.map((a) => ({
             personId: a.personId,
             personName: a.personName,
             weight: a.weight,
             bonusAmount: a.bonusAmount
          })),
          isWeightValid: true
        }));
        setCalculations(mappedCalculations);
      }
    } catch (e) {
      console.error('Failed to fetch calculations:', e);
    }
  }, []);

  const fetchBonusHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bonus/history`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setBonusHistory(data);
      }
    } catch (e) {
      console.error('Failed to fetch bonus history:', e);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    // Fetch Settings
    try {
      const settingsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/settings`, { credentials: 'include' });
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data);
      }
    } catch (e) { console.error('Failed to fetch settings:', e); }

    // Fetch Clients
    try {
      const clientsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/clients`, { credentials: 'include' });
      if (clientsRes.ok) {
         const clientsData = await clientsRes.json();
         const parsedClients = (clientsData as (Client & { onboardingDate: string, overrides: Override[] })[]).map((c) => ({
           ...c,
           onboardingDate: new Date(c.onboardingDate),
         }));
         setClients(parsedClients);
         
         // Extract and set overrides
         const allOverrides = parsedClients.flatMap(c => c.overrides || []);
         setOverrides(allOverrides);
      }
    } catch (e) { console.error('Failed to fetch clients:', e); }

    // Fetch People
    try {
      const peopleRes = await fetch(`${import.meta.env.VITE_API_URL}/api/people`, { credentials: 'include' });
      if (peopleRes.ok) {
        setPeople(await peopleRes.json());
      }
    } catch (e) { console.error('Failed to fetch people:', e); }

    // Fetch Calculations
    await fetchCalculations();

    // Fetch Bonus History
    await fetchBonusHistory();

    setIsLoading(false);
  }, [fetchCalculations, fetchBonusHistory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addClient = useCallback(
    async (data: { name: string; onboardingDate: string | Date; monthlyRevenue?: { month: string; collected: number; isEligible?: boolean }[] }) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: data.name,
            onboardingDate: data.onboardingDate,
          }),
        });
        
        if (response.ok) {
          const newClient = await response.json();
          // Ideally we re-fetch to get consistent state
          fetchData();
          return newClient;
        }
      } catch (error) {
        console.error('Error adding client:', error);
      }
    },
    [fetchData]
  );

  const addPerson = useCallback(async (personData: Omit<Person, "id">) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/people`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(personData),
      });

      if (!response.ok) {
        throw new Error('Failed to create person');
      }

      const newPerson = await response.json();
      setPeople((prev) => [...prev, newPerson]);
      fetchCalculations(); // Recalculate as weights/allocations might change if we auto-assign?
    } catch (error) {
      console.error('Error adding person:', error);
      throw error;
    }
  }, [fetchCalculations]);

  const updateSettings = useCallback(async (newSettings: Settings) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      fetchCalculations(); // Settings change affects calculations
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }, [fetchCalculations]);

  const updateClientAllocations = useCallback(
    async (clientId: string, newAllocations: TeamAllocation[]) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/${clientId}/allocations`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ allocations: newAllocations }),
        });

        if (!response.ok) {
          throw new Error('Failed to update allocations');
        }

        // Optimistic update for UI responsiveness
        setClients((prev) => {
          const client = prev.find((c) => c.id === clientId);
          if (!client) return prev;

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

        // Fetch fresh calculations
        fetchCalculations();
        
      } catch (error) {
        console.error('Error updating allocations:', error);
      }
    },
    [fetchCalculations]
  );

  const getClientById = useCallback(
    (clientId: string) => clients.find((c) => c.id === clientId),
    [clients]
  );

  const updateClientRevenue = useCallback(
    async (clientId: string, revenue: { month: string; collected: number; isEligible: boolean }[]) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/${clientId}/revenue`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ revenue }),
        });

        if (!response.ok) {
          throw new Error('Failed to update revenue');
        }

        setClients((prev) =>
          prev.map((c) =>
            c.id === clientId ? { ...c, monthlyRevenue: revenue } : c
          )
        );
        
        // Fetch fresh calculations
        fetchCalculations();
      } catch (error) {
        console.error('Error updating revenue:', error);
      }
    },
    [fetchCalculations]
  );

  const getPersonBonusHistory = useCallback(
    (personId: string) => {
      return bonusHistory
        .filter((h) => h.personId === personId)
        .sort((a, b) => getCycleStartDate(b.period).getTime() - getCycleStartDate(a.period).getTime());
    },
    [bonusHistory]
  );

  const getClientBonusHistory = useCallback(
    (clientId: string) => {
      return bonusHistory
        .filter((h) => h.clientId === clientId)
        .sort((a, b) => getCycleStartDate(b.period).getTime() - getCycleStartDate(a.period).getTime());
    },
    [bonusHistory]
  );

  const addOverride = useCallback(
    async (overrideData: Omit<Override, "id" | "approvalDate">) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/${overrideData.clientId}/overrides`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(overrideData),
        });

        if (!response.ok) {
          throw new Error('Failed to create override');
        }

        const newOverride = await response.json();
        
        // Update local state
        setOverrides((prev) => {
          const filtered = prev.filter(
            (o) => !(o.clientId === overrideData.clientId && o.personId === overrideData.personId)
          );
          return [newOverride, ...filtered];
        });
        
        // Refresh calculations to reflect override
        fetchCalculations();
        
      } catch (error) {
        console.error('Error adding override:', error);
      }
    },
    [fetchCalculations]
  );

  const getClientOverrides = useCallback(
    (clientId: string) => overrides.filter((o) => o.clientId === clientId),
    [overrides]
  );

  const processPayout = useCallback(
    async (clientId: string, period: string) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/${clientId}/payout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ period }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to process payout');
        }

        const result = await response.json();
        
        // Refresh history and calculations
        fetchData();
        
        return result;
      } catch (error) {
        console.error('Error processing payout:', error);
        throw error;
      }
    },
    [fetchData]
  );

  return {
    clients,
    people,
    settings,
    calculations,
    bonusHistory,
    allocationChanges,
    overrides,
    addClient,
    addPerson,
    updateSettings,
    updateClientAllocations,
    updateClientRevenue,
    getClientById,
    getPersonBonusHistory,
    getClientBonusHistory,
    addOverride,
    getClientOverrides,
    processPayout,
    fetchBonusHistory,
    isLoading,
    isHistoryLoading,
  };
}
