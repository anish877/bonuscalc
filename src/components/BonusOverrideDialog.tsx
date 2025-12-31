import { useState } from "react";
import { Override, IndividualAllocation } from "@/types/bonus";
import { formatCurrency } from "@/lib/bonusCalculations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";

interface BonusOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  allocations: IndividualAllocation[];
  existingOverrides: Override[];
  onSubmitOverride: (override: Omit<Override, "id" | "approvalDate">) => Promise<void> | void;
}

export function BonusOverrideDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  allocations,
  existingOverrides,
  onSubmitOverride,
}: BonusOverrideDialogProps) {
  const [selectedPersonId, setSelectedPersonId] = useState<string>("");
  const [overrideAmount, setOverrideAmount] = useState("");
  const [reason, setReason] = useState("");
  const [approvedBy, setApprovedBy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAllocation = allocations.find((a) => a.personId === selectedPersonId);
  const existingOverride = existingOverrides.find(
    (o) => o.clientId === clientId && o.personId === selectedPersonId
  );

  const handleSubmit = async () => {
    if (!selectedPersonId || !overrideAmount || !reason || !approvedBy) return;

    setIsSubmitting(true);
    try {
      await onSubmitOverride({
        clientId,
        personId: selectedPersonId,
        originalAmount: selectedAllocation?.bonusAmount ?? 0,
        overrideAmount: parseFloat(overrideAmount),
        reason,
        approvedBy,
      });

      // Reset form
      setSelectedPersonId("");
      setOverrideAmount("");
      setReason("");
      setApprovedBy("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to submit override", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = selectedPersonId && overrideAmount && reason && approvedBy;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Override Bonus Amount</DialogTitle>
          <DialogDescription>
            Manually adjust the calculated bonus for {clientName}. This requires approval documentation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Team Member Selection */}
          <div className="space-y-2">
            <Label htmlFor="person">Team Member</Label>
            <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member..." />
              </SelectTrigger>
              <SelectContent>
                {allocations.map((alloc) => (
                  <SelectItem key={alloc.personId} value={alloc.personId}>
                    {alloc.personName} - Current: {formatCurrency(alloc.bonusAmount)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current vs Override Amount */}
          {selectedAllocation && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Original Calculated Amount</span>
                <span className="font-medium">{formatCurrency(selectedAllocation.bonusAmount)}</span>
              </div>
              {existingOverride && (
                <div className="flex items-center gap-2 text-warning text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Existing override: {formatCurrency(existingOverride.overrideAmount)}</span>
                </div>
              )}
            </div>
          )}

          {/* Override Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">New Bonus Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              min={0}
              step={0.01}
              value={overrideAmount}
              onChange={(e) => setOverrideAmount(e.target.value)}
              placeholder="Enter override amount..."
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Override</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this override is necessary..."
              rows={3}
            />
          </div>

          {/* Approver */}
          <div className="space-y-2">
            <Label htmlFor="approver">Approved By</Label>
            <Input
              id="approver"
              value={approvedBy}
              onChange={(e) => setApprovedBy(e.target.value)}
              placeholder="Finance manager name..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Override"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
