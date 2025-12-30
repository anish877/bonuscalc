import { useMemo } from "react";
import { BonusHistoryRecord } from "@/types/bonus";
import { formatCurrency, formatPercentage } from "@/lib/bonusCalculations";
import { X, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getPayoutCycleLabel } from "@/hooks/useClientData";

interface ClientBonusHistoryProps {
  clientName: string;
  history: BonusHistoryRecord[];
  onClose: () => void;
}

export function ClientBonusHistory({ clientName, history, onClose }: ClientBonusHistoryProps) {
  // Group by 6-month payout cycle
  const groupedByCycle = useMemo(() => {
    const groups: Record<string, BonusHistoryRecord[]> = {};
    history.forEach((h) => {
      if (!groups[h.period]) groups[h.period] = [];
      groups[h.period].push(h);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [history]);

  const grandTotal = history.reduce((sum, r) => sum + r.bonusAmount, 0);

  return (
    <div className="fixed inset-y-0 right-0 w-[520px] bg-card border-l border-border shadow-lg z-50 slide-up overflow-hidden flex flex-col">
      <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {clientName.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="font-semibold">{clientName}</h2>
            <p className="text-sm text-muted-foreground">6-Month Payout Cycles</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Summary Card */}
      <div className="px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Distributed (All Cycles)</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(grandTotal)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Payout Cycles</p>
            <p className="text-lg font-semibold">{groupedByCycle.length}</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {groupedByCycle.map(([cycle, records]) => {
            const cycleTotal = records.reduce((sum, r) => sum + r.bonusAmount, 0);
            const avgRevenue = records[0]?.averageMonthlyRevenue ?? 0;
            const bonusRate = records[0]?.appliedBonusPercentage ?? 0;

            return (
              <div key={cycle} className="space-y-3">
                <div className="flex items-center justify-between bg-primary/5 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-primary">{getPayoutCycleLabel(cycle)}</h3>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-lg text-success">{formatCurrency(cycleTotal)}</span>
                    <p className="text-xs text-muted-foreground">
                      {formatPercentage(bonusRate)} of {formatCurrency(avgRevenue)} avg
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pl-2">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-accent">
                            {record.personName.split(" ").map((n) => n[0]).join("")}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{record.personName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatPercentage(record.weight)} weight
                          </p>
                        </div>
                      </div>
                      <span className="font-medium text-success">
                        {formatCurrency(record.bonusAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {groupedByCycle.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No bonus history available
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
