import { ClientBonusCalculation } from "@/types/bonus";
import { formatCurrency, formatPercentage } from "@/lib/bonusCalculations";
import { StatusBadge } from "@/components/StatusBadge";
import { ChevronRight, AlertCircle, Lock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface ClientTableProps {
  calculations: (ClientBonusCalculation & { isFinalized?: boolean })[];
  onClientClick?: (clientId: string) => void;
  isLoading?: boolean;
}

export function ClientTable({ calculations, onClientClick, isLoading }: ClientTableProps) {
  if (isLoading) {
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
              <th className="text-center">Status</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </td>
                <td className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                <td className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                <td className="text-center"><div className="flex justify-center"><Skeleton className="h-6 w-12" /></div></td>
                <td className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></td>
                <td className="text-center"><div className="flex justify-center"><Skeleton className="h-5 w-16" /></div></td>
                <td className="text-center"><Skeleton className="h-6 w-20 mx-auto" /></td>
                <td><Skeleton className="h-4 w-4" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

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
            <th className="text-center">Status</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {calculations.map((calc) => (
            <tr
              key={calc.clientId}
              onClick={() => calc.isEligible && onClientClick?.(calc.clientId)}
              className={cn(
                "transition-colors",
                calc.isEligible ? "cursor-pointer hover:bg-muted/50" : "opacity-60 cursor-not-allowed bg-muted/20"
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
              {calc.isEligible ? (
                <>
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
                  <td className="text-center">
                    {calc.isFinalized ? (
                      <div className="flex items-center justify-center text-success text-xs font-medium">
                        <Lock className="h-3 w-3 mr-1" />
                        Finalized
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">—</div>
                    )}
                  </td>
                  <td>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </td>
                </>
              ) : (
                <td colSpan={7} className="text-center py-4">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <span className="font-medium text-destructive/80">Not Eligible</span>
                    {calc.eligibilityReason && (
                      <span className="text-xs max-w-[300px] truncate" title={calc.eligibilityReason}>
                        {calc.eligibilityReason}
                      </span>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
