import { useState, useEffect, useMemo } from "react";
import { ClientBonusCalculation, Person, TeamAllocation, Client, Override } from "@/types/bonus";
import { formatCurrency, formatPercentage, calculateClientBonus } from "@/lib/bonusCalculations";
import { X, Calculator, Users, TrendingUp, AlertTriangle, Check, Plus, Trash2, History, FileEdit } from "lucide-react";
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
  onAddOverride: (override: Omit<Override, "id" | "approvalDate">) => void;
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
  onAddOverride,
}: EditableAllocationPanelProps) {
  const [localAllocations, setLocalAllocations] = useState<TeamAllocation[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newMemberId, setNewMemberId] = useState<string>("");
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [showOverrideHistory, setShowOverrideHistory] = useState(false);

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

  // Calculate preview bonuses in real-time
  const previewCalculation = useMemo(() => {
    if (!client) return null;
    const tempClient = { ...client, teamAllocations: localAllocations };
    return calculateClientBonus(tempClient, settings, people);
  }, [client, localAllocations, settings, people]);

  const availableMembers = useMemo(() => {
    const assignedIds = new Set(localAllocations.map((a) => a.personId));
    return people.filter((p) => !assignedIds.has(p.id));
  }, [people, localAllocations]);

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

  const handleSave = () => {
    if (isValid) {
      onSave(client.id, localAllocations);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setLocalAllocations([...client.teamAllocations]);
    setIsEditing(false);
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
              <span className="font-medium">{formatCurrency(calculation.totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg Monthly Revenue</span>
              <span className="font-medium">{formatCurrency(calculation.averageMonthlyRevenue)}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Expense Deduction</span>
              <span className="text-destructive">-{formatCurrency(calculation.expenseDeduction)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Net Revenue</span>
              <span className="font-semibold text-primary">{formatCurrency(calculation.netRevenue)}</span>
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
                {formatCurrency(previewCalculation?.totalBonusPool ?? calculation.totalBonusPool)}
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
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    Edit Weights
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={!isValid}>
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {localAllocations.map((allocation) => {
              const person = people.find((p) => p.id === allocation.personId);
              const previewAlloc = previewCalculation?.allocations.find(
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
                          {formatCurrency(override.overrideAmount)}
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
        allocations={previewCalculation?.allocations ?? calculation.allocations}
        existingOverrides={overrides}
        onSubmitOverride={onAddOverride}
      />
    </div>
  );
}
