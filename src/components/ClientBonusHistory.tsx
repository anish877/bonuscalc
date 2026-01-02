import { useMemo } from "react";
import { HalfYearBonus, BonusHistoryRecord } from "@/types/bonus";
import { formatCurrency, formatPercentage } from "@/lib/bonusCalculations";
import { X, Calendar, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface ClientBonusHistoryProps {
  clientName: string;
  history: (HalfYearBonus | BonusHistoryRecord)[];
  onClose: () => void;
  onProcessPayout?: (period: string) => Promise<void>;
  isLoading?: boolean;
}

export function ClientBonusHistory({ clientName, history, onClose, isLoading, onProcessPayout }: ClientBonusHistoryProps) {
  const isHalfYear = (r: HalfYearBonus | BonusHistoryRecord): r is HalfYearBonus => (r as HalfYearBonus).payouts !== undefined;
  const grandTotal = history.reduce((sum, r) => {
    if (isHalfYear(r)) {
      const calc = Number(r.calculatedBonus);
      const payoutsSum = (r.payouts ?? []).reduce((ps, p) => ps + (Number(p.amount) || 0), 0);
      return sum + (isNaN(calc) ? payoutsSum : calc);
    }
    return sum + (Number((r as BonusHistoryRecord).bonusAmount) || 0);
  }, 0);

  const handlePay = async (period: string) => {
      if (onProcessPayout) {
          await onProcessPayout(period);
      }
  };

  const getHalfYearFromPeriod = (period: string) => {
    const [yearStr, suffix] = period.split("-");
    const year = parseInt(yearStr);
    if (!suffix) return period;
    if (suffix.startsWith("Q")) {
      const q = parseInt(suffix.slice(1));
      if (q >= 3) return `${year}-H1`;
      return `${year - 1}-H2`;
    }
    const month = parseInt(suffix);
    if (!isNaN(month)) {
      if (month <= 6) return `${year - 1}-H2`;
      return `${year}-H1`;
    }
    return period;
  };

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
            <p className="text-sm text-muted-foreground">Payout History</p>
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
            <p className="text-sm text-muted-foreground">Total Bonus Earned</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(grandTotal)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Periods</p>
            <p className="text-lg font-semibold">{history.length}</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            ))
          ) : (
            history.map((entry) => {
              if (isHalfYear(entry)) {
                return (
                  <div key={entry.id} className="space-y-3 border rounded-lg p-4 bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-primary">{entry.period}</h3>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-lg text-success">
                          {formatCurrency(
                            isNaN(Number(entry.calculatedBonus))
                              ? (entry.payouts ?? []).reduce((ps, p) => ps + (Number(p.amount) || 0), 0)
                              : Number(entry.calculatedBonus)
                          )}
                        </span>
                        {typeof entry.totalRevenue !== 'undefined' && (
                          <p className="text-xs text-muted-foreground">
                            Total Revenue: {formatCurrency(Number(entry.totalRevenue) || 0)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scheduled Payouts</h4>
                      {(entry.payouts ?? []).map((payout) => (
                        <div
                          key={payout.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{payout.payoutPeriod}</span>
                              <span className="text-xs text-muted-foreground">Due: {payout.dueDate ? new Date(payout.dueDate).toLocaleDateString() : '-'}</span>
                              <span className="text-xs text-muted-foreground">Half-Year: {getHalfYearFromPeriod(payout.payoutPeriod)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-sm">
                              {formatCurrency(Number(payout.amount) || 0)}
                            </span>
                            {payout.status === 'PAID' ? (
                              <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/20 border-0">
                                <CheckCircle className="w-3 h-3 mr-1" /> Paid
                              </Badge>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-muted-foreground border-border">
                                  <Clock className="w-3 h-3 mr-1" /> Pending
                                </Badge>
                                {onProcessPayout && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-6 text-xs"
                                    onClick={() => handlePay(payout.payoutPeriod)}
                                  >
                                    Pay
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              const record = entry as BonusHistoryRecord;
              return (
                <div key={record.id} className="space-y-3 border rounded-lg p-4 bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-primary">{record.period}</h3>
                      <Badge variant="outline" className="ml-2">Half-Year: {getHalfYearFromPeriod(record.period)}</Badge>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-lg text-success">{formatCurrency(Number(record.bonusAmount) || 0)}</span>
                      {typeof record.averageMonthlyRevenue !== 'undefined' && (
                        <p className="text-xs text-muted-foreground">
                          Total Revenue: {formatCurrency(Number(record.averageMonthlyRevenue || 0) * 6)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {!isLoading && history.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No bonus history available
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
