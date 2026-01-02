import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { MetricCard } from "@/components/MetricCard";
import { SectionHeader } from "@/components/SectionHeader";
import { ClientTable } from "@/components/ClientTable";
import { TeamTable } from "@/components/TeamTable";
import { EditableAllocationPanel } from "@/components/EditableAllocationPanel";
import { PersonBonusHistory } from "@/components/PersonBonusHistory";
import { AddRevenuePanel } from "@/components/AddRevenuePanel";
import { ClientBonusHistory } from "@/components/ClientBonusHistory";
import { useClientData } from "@/hooks/useClientData";
import {
  getPersonTotalBonus,
  formatCurrency,
} from "@/lib/bonusCalculations";
import { DollarSign, Users, Building2, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HalfYear } from "@/types/bonus";

const Dashboard = () => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [revenueClientId, setRevenueClientId] = useState<string | null>(null);
  const [historyClientId, setHistoryClientId] = useState<string | null>(null);
  
  // Period Selection State
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [halfYear, setHalfYear] = useState<HalfYear>(new Date().getMonth() < 6 ? 'H1' : 'H2');

  const {
    clients,
    people,
    settings,
    calculations,
    updateClientAllocations,
    updateClientRevenue,
    getClientById,
    getPersonBonusHistory,
    addOverride,
    getClientOverrides,
    processPayout,
    fetchBonusHistory,
    fetchCalculations,
    halfYearHistory,
    isLoading,
    isHistoryLoading,
  } = useClientData();

  // Fetch calculations when period changes
  useEffect(() => {
    fetchCalculations(year, halfYear);
  }, [year, halfYear, fetchCalculations]);

  const calculationsWithStatus = useMemo(() => {
    return calculations.map(c => ({
      ...c,
      isFinalized: halfYearHistory.some(h => h.clientId === c.clientId && h.period === `${year}-${halfYear}`)
    }));
  }, [calculations, halfYearHistory, year, halfYear]);

  // Finalization handled by backend processes; no manual finalize in table

  const selectedClientOverrides = selectedClientId ? getClientOverrides(selectedClientId) : [];

  const selectedCalculation = useMemo(
    () => calculations.find((c) => c.clientId === selectedClientId) ?? null,
    [calculations, selectedClientId]
  );

  const selectedClient = selectedClientId ? getClientById(selectedClientId) : null;
  const revenueClient = revenueClientId ? getClientById(revenueClientId) : null;

  const historyClient = historyClientId ? getClientById(historyClientId) : null;
  const clientHalfYearHistory = useMemo(() => {
    return historyClientId 
        ? halfYearHistory.filter(h => h.clientId === historyClientId).sort((a, b) => b.period.localeCompare(a.period))
        : [];
  }, [halfYearHistory, historyClientId]);

  const selectedPerson = selectedPersonId
    ? people.find((p) => p.id === selectedPersonId) ?? null
    : null;

  const personHistory = selectedPersonId ? getPersonBonusHistory(selectedPersonId) : [];

  useEffect(() => {
    if (historyClientId) {
      fetchBonusHistory();
    }
  }, [historyClientId, fetchBonusHistory]);

  // Calculate summary metrics
  const totalBonusPool = calculations.reduce(
    (sum, c) => sum + c.totalBonusPool,
    0
  );
  const totalRevenue = calculations.reduce(
    (sum, c) => sum + c.totalRevenue,
    0
  );
  const avgBonusPerPerson =
    people.length > 0
      ? people.reduce(
          (sum, p) => sum + getPersonTotalBonus(p.id, calculations),
          0
        ) / people.length
      : 0;
  const invalidClients = calculations.filter((c) => !c.isWeightValid).length;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Bonus calculations for {year} {halfYear === 'H1' ? '(Jan - Jun)' : '(Jul - Dec)'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                    {[2024, 2025, 2026].map(y => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={halfYear} onValueChange={(v) => setHalfYear(v as HalfYear)}>
                <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="H1">H1</SelectItem>
                    <SelectItem value="H2">H2</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Bonus Pool"
            value={formatCurrency(totalBonusPool)}
            subtitle="Across all clients"
            icon={DollarSign}
            variant="primary"
            trend={{ value: "12.5%", positive: true }}
          />
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            subtitle="6-month collected"
            icon={TrendingUp}
            variant="accent"
          />
          <MetricCard
            title="Active Clients"
            value={String(clients.length)}
            subtitle={`${invalidClients} with allocation issues`}
            icon={Building2}
            variant={invalidClients > 0 ? "warning" : "default"}
          />
          <MetricCard
            title="Avg Bonus/Person"
            value={formatCurrency(avgBonusPerPerson)}
            subtitle={`${people.length} team members`}
            icon={Users}
            variant="default"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="clients">By Client</TabsTrigger>
            <TabsTrigger value="team">By Team Member</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-4">
            <SectionHeader
              title="Client Bonus Overview"
              description="Click a client to view detailed breakdown"
            />
            <ClientTable
              calculations={calculationsWithStatus}
              onClientClick={setSelectedClientId}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <SectionHeader
              title="Team Bonus Distribution"
              description="Total bonuses by team member across all clients"
            />
            <TeamTable
              people={people}
              calculations={calculations}
              onPersonClick={setSelectedPersonId}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Editable Client Panel */}
      <EditableAllocationPanel
        calculation={selectedCalculation}
        client={selectedClient ?? null}
        people={people}
        settings={settings}
        overrides={selectedClientOverrides}
        onClose={() => setSelectedClientId(null)}
        onSave={updateClientAllocations}
        onViewHistory={(clientId) => {
          setSelectedClientId(null);
          setHistoryClientId(clientId);
        }}
        onEditRevenue={(clientId) => {
          setSelectedClientId(null);
          setRevenueClientId(clientId);
        }}
        onAddOverride={addOverride}
        onProcessPayout={processPayout}
      />

      {/* Revenue Panel */}
      <AddRevenuePanel
        isOpen={!!revenueClientId}
        client={revenueClient}
        onClose={() => setRevenueClientId(null)}
        onSave={async (clientId, revenue) => {
          await updateClientRevenue(clientId, revenue);
        }}
      />

      {/* Client History Panel */}
      {historyClientId && historyClient && (
        <ClientBonusHistory
          clientName={historyClient.name}
          history={clientHalfYearHistory}
          onClose={() => setHistoryClientId(null)}
          onProcessPayout={async (period) => {
             await processPayout(historyClientId, period);
          }}
          isLoading={isHistoryLoading}
        />
      )}

      {/* Person History Panel */}
      <PersonBonusHistory
        person={selectedPerson}
        history={personHistory}
        onClose={() => setSelectedPersonId(null)}
        isLoading={isHistoryLoading}
      />

      {/* Overlay when panel is open */}
      {(selectedClientId || selectedPersonId || revenueClientId || historyClientId) && (
        <div
          className="fixed inset-0 bg-foreground/10 z-40"
          onClick={() => {
            setSelectedClientId(null);
            setSelectedPersonId(null);
            setRevenueClientId(null);
            setHistoryClientId(null);
          }}
        />
      )}
    </Layout>
  );
};

export default Dashboard;
