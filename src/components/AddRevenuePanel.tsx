import { useState, useEffect, useMemo } from "react";
import { Client, MonthlyRevenue } from "@/types/bonus";
import { formatCurrency } from "@/lib/bonusCalculations";
import { X, TrendingUp, Calendar, Save, History, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/ui/use-toast";

interface AddRevenuePanelProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onSave: (clientId: string, revenue: MonthlyRevenue[]) => Promise<void>;
}

export function AddRevenuePanel({
  isOpen,
  client,
  onClose,
  onSave,
}: AddRevenuePanelProps) {
  const [revenueData, setRevenueData] = useState<MonthlyRevenue[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Generate list of months from onboarding to now
  const monthsList = useMemo(() => {
    if (!client) return [];
    
    const start = new Date(client.onboardingDate);
    const end = new Date();
    const months: string[] = [];
    
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);

    while (current <= last) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      months.push(`${year}-${month}`);
      current.setMonth(current.getMonth() + 1);
    }
    
    // Sort descending (newest first)
    return months.reverse();
  }, [client]);

  useEffect(() => {
    if (client && isOpen) {
      // Merge existing revenue with generated months
      const currentRevenueMap = new Map(
        client.monthlyRevenue.map(r => [r.month, r])
      );

      const mergedData = monthsList.map(month => {
        const existing = currentRevenueMap.get(month);
        return {
          month,
          collected: existing?.collected ?? 0,
          isEligible: existing?.isEligible ?? true // Default to true, or calculate based on logic
        };
      });

      setRevenueData(mergedData);
    }
  }, [client, isOpen, monthsList]);

  const handleAmountChange = (month: string, amount: string) => {
    const value = parseFloat(amount);
    setRevenueData(prev => 
      prev.map(r => 
        r.month === month ? { ...r, collected: isNaN(value) ? 0 : value } : r
      )
    );
  };

  const handleCopyToAll = (amount: number) => {
    setRevenueData(prev =>
      prev.map(r => ({ ...r, collected: amount }))
    );
    toast({ title: "Copied", description: `Copied ${formatCurrency(amount)} to all months.` });
  };

  const handleSave = async () => {
    if (!client) return;
    
    setIsSaving(true);
    try {
      await onSave(client.id, revenueData);
      toast({ title: "Revenue updated", description: "Monthly revenue records saved successfully." });
      onClose();
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to save revenue.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const getMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[520px] bg-card border-l border-border shadow-lg z-50 slide-up overflow-y-auto flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {client.name.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="font-semibold">{client.name}</h2>
            <p className="text-sm text-muted-foreground">Monthly Revenue</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Revenue Records</h3>
        </div>

        <div className="space-y-3">
          {revenueData.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
              No months available since onboarding ({new Date(client.onboardingDate).toLocaleDateString()})
            </div>
          ) : (
            revenueData.map((record) => (
              <div 
                key={record.month} 
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg group hover:bg-muted/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{getMonthLabel(record.month)}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.isEligible ? 'Eligible for bonus' : 'Not eligible'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={record.collected || ''}
                      onChange={(e) => handleAmountChange(record.month, e.target.value)}
                      className="pl-7 w-32 text-right font-mono"
                      placeholder="0.00"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-primary"
                    title="Copy to all rows"
                    onClick={() => handleCopyToAll(record.collected)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-end gap-2 z-10">
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
