import { ClientBonusCalculation } from "@/types/bonus";
import { formatCurrency, formatPercentage } from "@/lib/bonusCalculations";
import { X, Calculator, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";

interface ClientDetailPanelProps {
  calculation: ClientBonusCalculation | null;
  onClose: () => void;
}

export function ClientDetailPanel({
  calculation,
  onClose,
}: ClientDetailPanelProps) {
  if (!calculation) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-card border-l border-border shadow-lg z-50 slide-up overflow-y-auto">
      <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {calculation.clientName.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="font-semibold">{calculation.clientName}</h2>
            <p className="text-sm text-muted-foreground">Bonus Breakdown</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-6 space-y-6">
        {/* Warning if weights invalid */}
        {!calculation.isWeightValid && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-warning">Invalid Allocation</p>
              <p className="text-sm text-muted-foreground mt-1">
                Team weights must equal 100%. Current total:{" "}
                {calculation.allocations.reduce((s, a) => s + a.weight, 0)}%
              </p>
            </div>
          </div>
        )}

        {/* Revenue Summary */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Revenue Summary</h3>
          </div>
          <div className="space-y-3 bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Eligible Months</span>
              <span className="font-medium">{calculation.eligibleMonths}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Revenue (6mo)</span>
              <span className="font-medium">
                {formatCurrency(calculation.totalRevenue)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg Monthly Revenue</span>
              <span className="font-medium">
                {formatCurrency(calculation.averageMonthlyRevenue)}
              </span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Expense Deduction</span>
              <span className="text-destructive">
                -{formatCurrency(calculation.expenseDeduction)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Net Revenue</span>
              <span className="font-semibold text-primary">
                {formatCurrency(calculation.netRevenue)}
              </span>
            </div>
          </div>
        </div>

        {/* Bonus Calculation */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Bonus Calculation</h3>
          </div>
          <div className="space-y-3 bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Applied Bonus Rate</span>
              <StatusBadge status="info">
                {formatPercentage(calculation.appliedBonusPercentage)}
              </StatusBadge>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="font-medium">Total Bonus Pool</span>
              <span className="text-xl font-bold text-success">
                {formatCurrency(calculation.totalBonusPool)}
              </span>
            </div>
          </div>
        </div>

        {/* Team Allocation */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Team Allocation</h3>
          </div>
          <div className="space-y-2">
            {calculation.allocations.map((allocation) => (
              <div
                key={allocation.personId}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-accent">
                      {allocation.personName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{allocation.personName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPercentage(allocation.weight)} weight
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-success">
                  {formatCurrency(allocation.bonusAmount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
