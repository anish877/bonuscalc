import { useState, useEffect, useMemo, useCallback } from "react";
import { ClientBonusCalculation, Person, TeamAllocation, Client, Override } from "@/types/bonus";
import { formatCurrency, formatPercentage } from "@/lib/bonusCalculations";
import { X, Calculator, Users, TrendingUp, AlertTriangle, Check, Plus, Trash2, History, FileEdit, DollarSign, Calendar, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Settings } from "@/types/bonus";
import { BonusOverrideDialog } from "@/components/BonusOverrideDialog";
import { OverrideHistory } from "@/components/OverrideHistory";

interface EditableAllocationPanelProps {
  calculation: ClientBonusCalculation | null;
  client: Client | null;
  people: Person[];
  settings: Settings;
  overrides: Override[];
  onClose: () => void;
  onSave: (clientId: string, allocations: TeamAllocation[]) => void;
  onViewHistory: (clientId: string) => void;
  onEditRevenue: (clientId: string) => void;
  onAddOverride: (override: Omit<Override, "id" | "approvalDate">) => void;
  onProcessPayout: (clientId: string, period: string) => Promise<unknown>;
}

export function EditableAllocationPanel({
  calculation,
  client,
  people,
  settings,
  overrides,
  onClose,
  onSave,
  onViewHistory,
  onEditRevenue,
  onAddOverride,
  onProcessPayout,
}: EditableAllocationPanelProps) {
  const [localAllocations, setLocalAllocations] = useState<TeamAllocation[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newMemberId, setNewMemberId] = useState<string>("");
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [showOverrideHistory, setShowOverrideHistory] = useState(false);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayCalc, setDisplayCalc] = useState<ClientBonusCalculation | null>(calculation);
  const now = new Date();
  const quarterOptions = useMemo(() => {
    if (!client) return [];
    const start = new Date(client.onboardingDate);
    // Normalize to start of its quarter
    const startQuarter = Math.floor(start.getMonth() / 3) + 1;
    const startYear = start.getFullYear();
    const options: string[] = [];
    let y = startYear;
    let q = startQuarter;
    const currentYear = now.getFullYear();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    while (y < currentYear || (y === currentYear && q <= currentQuarter)) {
      options.push(`${y}-Q${q}`);
      q += 1;
      if (q > 4) { q = 1; y += 1; }
    }
    return options;
  }, [client, now]);
  const [selectedQuarter, setSelectedQuarter] = useState<string>("");
  useEffect(() => {
    if (quarterOptions.length > 0 && !selectedQuarter) {
      setSelectedQuarter(quarterOptions[quarterOptions.length - 1]);
    }
  }, [quarterOptions, selectedQuarter]);
  const halfYearRef = useMemo(() => {
    if (!selectedQuarter) return "";
    const [yStr, qStr] = selectedQuarter.split("-");
    const y = parseInt(yStr);
    const q = qStr as "Q1" | "Q2" | "Q3" | "Q4";
    if (q === "Q3" || q === "Q4") return `${y}-H1`;
    return `${y - 1}-H2`;
  }, [selectedQuarter]);
  const loadCalcForSelectedQuarter = useCallback(async () => {
    if (!selectedQuarter || !client) return;
    const [yStr, qStr] = selectedQuarter.split("-");
    const y = parseInt(yStr);
    const q = qStr as "Q1" | "Q2" | "Q3" | "Q4";
    const refYear = q === "Q3" || q === "Q4" ? y : y - 1;
    const refHalf: "H1" | "H2" = q === "Q3" || q === "Q4" ? "H1" : "H2";
    try {
      const params = new URLSearchParams({ year: refYear.toString(), halfYear: refHalf });
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bonus/calculations?${params.toString()}`, { credentials: 'include' });
      if (response.ok) {
        const data: {
          clientId: string;
          clientName: string;
          isEligible: boolean;
          eligibilityReason?: string;
          monthsConsidered: number;
          totalRevenue: number;
          averageMonthlyRevenue: number;
          netRevenue: number;
          bonusPercentage: number;
          bonusPool: number;
          allocations: { personId: string; personName: string; weight: number; bonusAmount: number }[];
          period: string;
          consideredMonthsList: string[];
        }[] = await response.json();
        const clientCalc = data.find((d) => d.clientId === client.id);
        if (clientCalc) {
          const mapped: ClientBonusCalculation = {
            clientId: clientCalc.clientId,
            clientName: clientCalc.clientName,
            isEligible: clientCalc.isEligible,
            eligibilityReason: clientCalc.eligibilityReason,
            eligibleMonths: clientCalc.monthsConsidered,
            totalRevenue: clientCalc.totalRevenue,
            averageMonthlyRevenue: clientCalc.averageMonthlyRevenue,
            expenseDeduction: clientCalc.totalRevenue - clientCalc.netRevenue,
            netRevenue: clientCalc.netRevenue,
            appliedBonusPercentage: clientCalc.bonusPercentage,
            totalBonusPool: clientCalc.bonusPool,
            allocations: clientCalc.allocations.map((a) => ({
              personId: a.personId,
              personName: a.personName,
              weight: a.weight,
              bonusAmount: a.bonusAmount
            })),
            isWeightValid: true,
            period: clientCalc.period,
            consideredMonthsList: clientCalc.consideredMonthsList,
          };
          setDisplayCalc(mapped);
        }
      }
    } catch (e) {
      console.error('Failed to load calculation for quarter:', e);
    }
  }, [selectedQuarter, client]);
  useEffect(() => {
    loadCalcForSelectedQuarter();
  }, [loadCalcForSelectedQuarter]);
  useEffect(() => {
    setDisplayCalc(calculation);
  }, [calculation]);

  useEffect(() => {
    if (client) {
      setLocalAllocations([...client.teamAllocations]);
      setIsEditing(false);
    }
  }, [client]);

  const totalWeight = useMemo(
    () => localAllocations.reduce((sum, a) => sum + a.weight, 0),
    [localAllocations]
  );

  const isValid = Math.abs(totalWeight - 100) < 0.01;

  // Calculate preview bonuses in real-time based on backend-provided pool
  const previewAllocations = useMemo(() => {
    const calc = displayCalc ?? calculation;
    if (!calc || !localAllocations.length) return [];
    
    // Distribute the known totalBonusPool according to local weights
    return localAllocations.map(alloc => {
       const person = people.find(p => p.id === alloc.personId);
       const bonusAmount = isValid ? (calc.totalBonusPool / 2) * (alloc.weight / 100) : 0;
       return {
         ...alloc,
         personName: person?.name ?? "Unknown",
         bonusAmount
       };
    });
  }, [displayCalc, calculation, localAllocations, people, isValid]);

  const availableMembers = useMemo(() => {
    const assignedIds = new Set(localAllocations.map((a) => a.personId));
    return people.filter((p) => !assignedIds.has(p.id));
  }, [people, localAllocations]);

  const effectiveTotalBonus = useMemo(() => {
    const calc = displayCalc ?? calculation;
    if (!calc || !localAllocations.length) return 0;
    
    return localAllocations.reduce((sum, alloc) => {
      // Check for override
      const override = overrides.find(o => o.personId === alloc.personId);
      if (override) {
        return sum + (override.overrideAmount / 2);
      }
      
      // Calculate standard bonus
      const bonusAmount = isValid ? (calc.totalBonusPool / 2) * (alloc.weight / 100) : 0;
      return sum + bonusAmount;
    }, 0);
  }, [displayCalc, calculation, localAllocations, overrides, isValid]);

  // legacy halfYearRef derived from payoutQuarter/year removed
  
  const halfPayoutAmount = useMemo(() => {
    const calc = displayCalc ?? calculation;
    return (calc?.totalBonusPool ?? 0) / 2;
  }, [displayCalc, calculation]);
  
  if (!calculation || !client) return null;

  const handleWeightChange = (personId: string, newWeight: number) => {
    setLocalAllocations((prev) =>
      prev.map((a) =>
        a.personId === personId ? { ...a, weight: Math.max(0, Math.min(100, newWeight)) } : a
      )
    );
  };

  const handleAddMember = () => {
    if (!newMemberId) return;
    setLocalAllocations((prev) => [...prev, { personId: newMemberId, weight: 0 }]);
    setNewMemberId("");
  };

  const handleRemoveMember = (personId: string) => {
    setLocalAllocations((prev) => prev.filter((a) => a.personId !== personId));
  };

  const handleSave = async () => {
    if (isValid) {
      setIsSaving(true);
      try {
        await onSave(client.id, localAllocations);
        setIsEditing(false);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = () => {
    setLocalAllocations([...client.teamAllocations]);
    setIsEditing(false);
  };

  const handleProcessPayout = async () => {
    if (!client) return;
    setIsProcessingPayout(true);
    try {
      await onProcessPayout(client.id, selectedQuarter);
      setShowPayoutDialog(false);
    } catch (error) {
      setShowPayoutDialog(false);
    } finally {
      setIsProcessingPayout(false);
    }
  };
  

  return (
    <div className="fixed inset-y-0 right-0 w-[520px] bg-card border-l border-border shadow-lg z-50 slide-up overflow-y-auto">
      <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewHistory(client.id)}
            className="gap-1"
          >
            <History className="h-4 w-4" />
            History
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Period & Context Info */}
        <div className="bg-primary/5 rounded-lg border border-primary/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-primary">
                        {(displayCalc ?? calculation)?.period ? (displayCalc ?? calculation)!.period!.replace('-', ' ') : 'Selected Period'}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Select quarter" />
                    </SelectTrigger>
                    <SelectContent>
                      {quarterOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <StatusBadge status={(displayCalc ?? calculation)?.isEligible ? "valid" : "invalid"}>
                    {(displayCalc ?? calculation)?.isEligible ? "Eligible" : "Not Eligible"}
                  </StatusBadge>
                </div>
            </div>
            
            {(displayCalc ?? calculation)?.consideredMonthsList && (displayCalc ?? calculation)!.consideredMonthsList!.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-medium text-foreground mb-1">Included Months:</p>
                        <div className="flex flex-wrap gap-1">
                            {(displayCalc ?? calculation)!.consideredMonthsList!.map(m => {
                                const [y, mon] = m.split('-');
                                const date = new Date(parseInt(y), parseInt(mon) - 1);
                                return (
                                    <span key={m} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-background border border-border">
                                        {date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {!(displayCalc ?? calculation)?.isEligible && (displayCalc ?? calculation)?.eligibilityReason && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 p-2 rounded">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>{(displayCalc ?? calculation)!.eligibilityReason}</p>
                </div>
            )}
            
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="text-sm text-muted-foreground">Selected Quarter</div>
              <div className="text-sm font-medium">{selectedQuarter}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Half-Year Reference</div>
              <div className="text-sm font-medium">{halfYearRef}</div>
            </div>
        </div>

        {/* Weight Validation Status */}
        <div
          className={`flex items-center justify-between p-3 rounded-lg border ${
            isValid
              ? "bg-success/10 border-success/20"
              : "bg-warning/10 border-warning/20"
          }`}
        >
          <div className="flex items-center gap-2">
            {isValid ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-warning" />
            )}
            <span className={`text-sm font-medium ${isValid ? "text-success" : "text-warning"}`}>
              Total Weight: {totalWeight.toFixed(1)}%
            </span>
          </div>
          {!isValid && (
            <span className="text-xs text-muted-foreground">
              Must equal 100%
            </span>
          )}
        </div>

        {/* Revenue Summary */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Revenue Summary</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="default" 
                size="lg" 
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg font-bold text-md px-6"
                onClick={() => setShowPayoutDialog(true)}
                disabled={!((displayCalc ?? calculation)?.isEligible)}
              >
                <DollarSign className="h-5 w-5" />
                Payout
              </Button>
              <Button 
                variant="default" 
                size="default" 
                className="bg-success text-success-foreground hover:bg-success/90 shadow-sm"
                onClick={() => onEditRevenue(client.id)}
              >
                Update Revenue
              </Button>
            </div>
          </div>
          <div className="space-y-3 bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Eligible Months</span>
              <span className="font-medium">{(displayCalc ?? calculation)?.eligibleMonths}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Revenue (6mo)</span>
              <span className="font-medium">{formatCurrency((displayCalc ?? calculation)?.totalRevenue || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg Monthly Revenue</span>
              <span className="font-medium">{formatCurrency((displayCalc ?? calculation)?.averageMonthlyRevenue || 0)}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Expense Deduction</span>
              <span className="text-destructive">-{formatCurrency((displayCalc ?? calculation)?.expenseDeduction || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Net Revenue</span>
              <span className="font-semibold text-primary">{formatCurrency((displayCalc ?? calculation)?.netRevenue || 0)}</span>
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
                {formatPercentage((displayCalc ?? calculation)?.appliedBonusPercentage || 0)}
              </StatusBadge>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="font-medium">Quarter Payout (50%)</span>
              <span className="text-xl font-bold text-success">
                {formatCurrency(halfPayoutAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Team Allocation - Editable */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Team Allocation</h3>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOverrideDialog(true)}
                    className="gap-1"
                  >
                    <FileEdit className="h-4 w-4" />
                    Override
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                    className="gap-1 bg-success text-success-foreground hover:bg-success/90"
                  >
                    <Plus className="h-4 w-4" />
                    Add Member & Edit Weight
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={!isValid || isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {localAllocations.map((allocation) => {
              const person = people.find((p) => p.id === allocation.personId);
              const previewAlloc = previewAllocations.find(
                (a) => a.personId === allocation.personId
              );
              const override = overrides.find((o) => o.personId === allocation.personId);

              return (
                <div
                  key={allocation.personId}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-accent">
                        {person?.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("") ?? "?"}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{person?.name ?? "Unknown"}</p>
                        {override && (
                          <StatusBadge status="warning">Overridden</StatusBadge>
                        )}
                      </div>
                      {isEditing ? (
                        <div className="flex items-center gap-1 mt-1">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={allocation.weight}
                            onChange={(e) =>
                              handleWeightChange(allocation.personId, parseFloat(e.target.value) || 0)
                            }
                            className="h-7 w-20 text-xs"
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {formatPercentage(allocation.weight)} weight
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {override ? (
                      <div className="text-right">
                        <span className="font-semibold text-primary">
                          {formatCurrency(override.overrideAmount / 2)}
                        </span>
                        <p className="text-xs text-muted-foreground line-through">
                          {formatCurrency(previewAlloc?.bonusAmount ?? 0)}
                        </p>
                      </div>
                    ) : (
                      <span className={`font-semibold ${isValid ? "text-success" : "text-muted-foreground"}`}>
                        {formatCurrency(previewAlloc?.bonusAmount ?? 0)}
                      </span>
                    )}
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveMember(allocation.personId)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add Member */}
            {isEditing && availableMembers.length > 0 && (
              <div className="flex items-center gap-2 p-3 border border-dashed border-border rounded-lg">
                <Select value={newMemberId} onValueChange={setNewMemberId}>
                  <SelectTrigger className="flex-1 h-9">
                    <SelectValue placeholder="Add team member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} - {p.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handleAddMember}
                  disabled={!newMemberId}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Override History */}
        {overrides.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileEdit className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Override History</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOverrideHistory(!showOverrideHistory)}
              >
                {showOverrideHistory ? "Hide" : "Show"}
              </Button>
            </div>
            {showOverrideHistory && (
              <div className="bg-muted/50 rounded-lg p-4 overflow-x-auto">
                <OverrideHistory overrides={overrides} people={people} clientFilter={client.id} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Override Dialog */}
      <BonusOverrideDialog
        open={showOverrideDialog}
        onOpenChange={setShowOverrideDialog}
        clientId={client.id}
        clientName={client.name}
        allocations={previewAllocations}
        existingOverrides={overrides}
        onSubmitOverride={onAddOverride}
      />

      {/* Payout Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Bonus Payout</DialogTitle>
            <DialogDescription>
              Confirm the payout details for {client.name}. This will record the payout in the history.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Selected Quarter</Label>
              <div className="col-span-3 font-medium">
                {selectedQuarter}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Half-Year Reference</Label>
              <div className="col-span-3 font-medium">
                {halfYearRef}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Total Payout</Label>
              <div className="col-span-3 font-semibold text-lg text-success">
                {formatCurrency(halfPayoutAmount)}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleProcessPayout} 
              disabled={isProcessingPayout}
            >
              {isProcessingPayout ? "Processing..." : "Confirm Payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
