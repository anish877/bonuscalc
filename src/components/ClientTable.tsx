import { ClientBonusCalculation } from "@/types/bonus";
import { formatCurrency, formatPercentage } from "@/lib/bonusCalculations";
import { StatusBadge } from "@/components/StatusBadge";
import { ChevronRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientTableProps {
  calculations: ClientBonusCalculation[];
  onClientClick?: (clientId: string) => void;
}

export function ClientTable({ calculations, onClientClick }: ClientTableProps) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="data-table">
        <thead>
          <tr>
            <th>Client</th>
            <th className="text-right">Avg. Revenue</th>
            <th className="text-right">Net Revenue</th>
            <th className="text-center">Bonus %</th>
            <th className="text-right">Bonus Pool</th>
            <th className="text-center">Team</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {calculations.map((calc) => (
            <tr
              key={calc.clientId}
              onClick={() => onClientClick?.(calc.clientId)}
              className={cn(
                "transition-colors cursor-pointer",
                "hover:bg-muted/50"
              )}
            >
              <td>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {calc.clientName.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{calc.clientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {calc.eligibleMonths} months
                    </p>
                  </div>
                </div>
              </td>
              <td className="text-right font-medium">
                {formatCurrency(calc.averageMonthlyRevenue)}
              </td>
              <td className="text-right text-muted-foreground">
                {formatCurrency(calc.netRevenue)}
              </td>
              <td className="text-center">
                <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-accent/10 text-accent text-sm font-medium">
                  {formatPercentage(calc.appliedBonusPercentage)}
                </span>
              </td>
              <td className="text-right">
                <span className="font-semibold text-success">
                  {formatCurrency(calc.totalBonusPool)}
                </span>
              </td>
              <td className="text-center">
                {calc.isWeightValid ? (
                  <StatusBadge status="valid">Valid</StatusBadge>
                ) : (
                  <StatusBadge status="invalid">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Invalid
                  </StatusBadge>
                )}
              </td>
              <td>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
