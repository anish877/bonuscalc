import { useMemo } from "react";
import { BonusHistoryRecord, Person } from "@/types/bonus";
import { formatCurrency, formatPercentage } from "@/lib/bonusCalculations";
import { X, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getPayoutCycleLabel, getCycleStartDate } from "@/hooks/useClientData";
import { exportPersonBonusHistory } from "@/lib/exportUtils";
import { Skeleton } from "@/components/ui/skeleton";

interface PersonBonusHistoryProps {
  person: Person | null;
  history: BonusHistoryRecord[];
  onClose: () => void;
  isLoading?: boolean;
}

export function PersonBonusHistory({ person, history, onClose, isLoading }: PersonBonusHistoryProps) {
  // Group by payout period (Month or Cycle)
  const groupedByCycle = useMemo(() => {
    const groups: Record<string, BonusHistoryRecord[]> = {};
    history.forEach((h) => {
      if (!groups[h.period]) groups[h.period] = [];
      groups[h.period].push(h);
    });
    return Object.entries(groups).sort(([a], [b]) => {
      return getCycleStartDate(b).getTime() - getCycleStartDate(a).getTime();
    });
  }, [history]);

  const grandTotal = history.reduce((sum, r) => sum + r.bonusAmount, 0);

  if (!person) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[520px] bg-card border-l border-border shadow-lg z-50 slide-up overflow-hidden flex flex-col">
      <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-accent">
              {person.name.split(" ").map((n) => n[0]).join("")}
            </span>
          </div>
          <div>
            <h2 className="font-semibold">{person.name}</h2>
            <p className="text-sm text-muted-foreground">Payout History</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportPersonBonusHistory(person.name, history)}
            className="gap-1"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Bonus (All Cycles)</p>
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
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center justify-between bg-primary/5 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-6 w-24 mb-1" />
                    <Skeleton className="h-3 w-16 ml-auto" />
                  </div>
                </div>
                <div className="space-y-2 pl-2">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <Skeleton className="h-4 w-32 mb-1" />
                        <div className="flex items-center gap-2 mt-1">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-2" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            groupedByCycle.map(([cycle, records]) => {
            const cycleTotal = records.reduce((sum, r) => sum + r.bonusAmount, 0);

            return (
              <div key={cycle} className="space-y-3">
                <div className="flex items-center justify-between bg-primary/5 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-primary">{getPayoutCycleLabel(cycle)}</h3>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-lg text-success">{formatCurrency(cycleTotal)}</span>
                    <p className="text-xs text-muted-foreground">{records.length} client{records.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div className="space-y-2 pl-2">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">{record.clientName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatPercentage(record.weight)} weight
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {formatPercentage(record.appliedBonusPercentage)} bonus rate
                          </span>
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
          })
          )}

          {!isLoading && groupedByCycle.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No bonus history available
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
