import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { SectionHeader } from "@/components/SectionHeader";
import { mockClients, mockPeople, mockSettings } from "@/data/mockData";
import {
  calculateAllBonuses,
  formatCurrency,
  formatPercentage,
} from "@/lib/bonusCalculations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, ArrowRight, DollarSign, Percent, Building2 } from "lucide-react";

const CalculatorPage = () => {
  const [selectedClientId, setSelectedClientId] = useState<string>(
    mockClients[0]?.id ?? ""
  );

  const calculations = useMemo(
    () => calculateAllBonuses(mockClients, mockSettings, mockPeople),
    []
  );

  const selectedCalc = calculations.find((c) => c.clientId === selectedClientId);

  if (!selectedCalc) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">No clients available</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <SectionHeader
          title="Bonus Calculator"
          description="Step-by-step bonus calculation breakdown"
        />

        {/* Client Selector */}
        <div className="flex items-center gap-4">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {mockClients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Calculation Flow */}
        <div className="grid gap-4">
          {/* Step 1: Revenue */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                1
              </div>
              <h3 className="font-semibold">Calculate Average Revenue</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4 items-center">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  Total Revenue ({selectedCalc.eligibleMonths} months)
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(selectedCalc.totalRevenue)}
                </p>
              </div>
              <div className="flex justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>÷</span>
                  <span className="text-sm">{selectedCalc.eligibleMonths}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  Average Monthly Revenue
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(selectedCalc.averageMonthlyRevenue)}
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Expense */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                2
              </div>
              <h3 className="font-semibold">Deduct Company Expenses</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4 items-center">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  Avg Monthly Revenue
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(selectedCalc.averageMonthlyRevenue)}
                </p>
              </div>
              <div className="flex justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>×</span>
                  <span className="text-sm">60%</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Net Revenue</p>
                <p className="text-2xl font-bold text-accent">
                  {formatCurrency(selectedCalc.netRevenue)}
                </p>
                <p className="text-xs text-destructive mt-1">
                  -{formatCurrency(selectedCalc.expenseDeduction)} expense
                </p>
              </div>
            </div>
          </div>

          {/* Step 3: Bonus Rate */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                3
              </div>
              <h3 className="font-semibold">Apply Bonus Rate</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4 items-center">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Net Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(selectedCalc.netRevenue)}
                </p>
              </div>
              <div className="flex justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>×</span>
                  <span className="px-2 py-1 rounded bg-accent/10 text-accent text-sm font-medium">
                    {formatPercentage(selectedCalc.appliedBonusPercentage)}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
              <div className="bg-success/5 border border-success/20 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  Total Bonus Pool
                </p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(selectedCalc.totalBonusPool)}
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Slab Applied:</strong> Avg revenue{" "}
                {selectedCalc.averageMonthlyRevenue <= 5000
                  ? "≤ $5,000"
                  : "> $5,000"}{" "}
                → {formatPercentage(selectedCalc.appliedBonusPercentage)} bonus rate
              </p>
            </div>
          </div>

          {/* Step 4: Allocations */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                4
              </div>
              <h3 className="font-semibold">Distribute to Team</h3>
            </div>
            <div className="space-y-3">
              {selectedCalc.allocations.map((allocation) => (
                <div
                  key={allocation.personId}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-accent">
                        {allocation.personName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{allocation.personName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPercentage(allocation.weight)} of pool
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(selectedCalc.totalBonusPool)} ×{" "}
                      {formatPercentage(allocation.weight)}
                    </p>
                    <p className="text-xl font-bold text-success">
                      {formatCurrency(allocation.bonusAmount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CalculatorPage;
