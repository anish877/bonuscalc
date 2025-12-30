import { useMemo } from "react";
import { BonusHistoryRecord, Person } from "@/types/bonus";
import { formatCurrency, formatPercentage } from "@/lib/bonusCalculations";
import { X, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PersonBonusHistoryProps {
  person: Person | null;
  history: BonusHistoryRecord[];
  onClose: () => void;
}

export function PersonBonusHistory({ person, history, onClose }: PersonBonusHistoryProps) {
  if (!person) return null;

  // Group by period
  const groupedByPeriod = useMemo(() => {
    const groups: Record<string, BonusHistoryRecord[]> = {};
    history.forEach((h) => {
      if (!groups[h.period]) groups[h.period] = [];
      groups[h.period].push(h);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [history]);

  // Calculate totals
  const totalsByPeriod = useMemo(() => {
    return groupedByPeriod.map(([period, records]) => ({
      period,
      total: records.reduce((sum, r) => sum + r.bonusAmount, 0),
      clients: records.length,
    }));
  }, [groupedByPeriod]);

  const grandTotal = history.reduce((sum, r) => sum + r.bonusAmount, 0);

  const formatPeriod = (period: string) => {
    const [year, month] = period.split("-");
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

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
            <p className="text-sm text-muted-foreground">Bonus History (6 Months)</p>
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
            <p className="text-sm text-muted-foreground">Total Bonus (6 Months)</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(grandTotal)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Avg per Month</p>
            <p className="text-lg font-semibold">
              {formatCurrency(grandTotal / Math.max(groupedByPeriod.length, 1))}
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {groupedByPeriod.map(([period, records]) => {
            const periodTotal = records.reduce((sum, r) => sum + r.bonusAmount, 0);

            return (
              <div key={period} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">{formatPeriod(period)}</h3>
                  </div>
                  <span className="font-semibold text-success">{formatCurrency(periodTotal)}</span>
                </div>

                <div className="space-y-2">
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
          })}

          {groupedByPeriod.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No bonus history available
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
