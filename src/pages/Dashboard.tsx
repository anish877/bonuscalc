import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { MetricCard } from "@/components/MetricCard";
import { SectionHeader } from "@/components/SectionHeader";
import { ClientTable } from "@/components/ClientTable";
import { TeamTable } from "@/components/TeamTable";
import { ClientDetailPanel } from "@/components/ClientDetailPanel";
import { mockClients, mockPeople, mockSettings } from "@/data/mockData";
import {
  calculateAllBonuses,
  getPersonTotalBonus,
  formatCurrency,
} from "@/lib/bonusCalculations";
import { DollarSign, Users, Building2, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const calculations = useMemo(
    () => calculateAllBonuses(mockClients, mockSettings, mockPeople),
    []
  );

  const selectedCalculation = useMemo(
    () => calculations.find((c) => c.clientId === selectedClientId) ?? null,
    [calculations, selectedClientId]
  );

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
    mockPeople.length > 0
      ? mockPeople.reduce(
          (sum, p) => sum + getPersonTotalBonus(p.id, calculations),
          0
        ) / mockPeople.length
      : 0;
  const invalidClients = calculations.filter((c) => !c.isWeightValid).length;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bonus calculations for the last 6 completed months
          </p>
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
            value={String(mockClients.length)}
            subtitle={`${invalidClients} with allocation issues`}
            icon={Building2}
            variant={invalidClients > 0 ? "warning" : "default"}
          />
          <MetricCard
            title="Avg Bonus/Person"
            value={formatCurrency(avgBonusPerPerson)}
            subtitle={`${mockPeople.length} team members`}
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
              calculations={calculations}
              onClientClick={setSelectedClientId}
            />
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <SectionHeader
              title="Team Bonus Distribution"
              description="Total bonuses by team member across all clients"
            />
            <TeamTable people={mockPeople} calculations={calculations} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Panel */}
      <ClientDetailPanel
        calculation={selectedCalculation}
        onClose={() => setSelectedClientId(null)}
      />

      {/* Overlay when panel is open */}
      {selectedClientId && (
        <div
          className="fixed inset-0 bg-foreground/10 z-40"
          onClick={() => setSelectedClientId(null)}
        />
      )}
    </Layout>
  );
};

export default Dashboard;
