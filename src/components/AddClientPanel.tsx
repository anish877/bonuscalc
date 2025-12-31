import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface ClientData {
  name: string;
  onboardingDate: string;
}

interface AddClientPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: ClientData) => Promise<void>;
}

export function AddClientPanel({ isOpen, onClose, onSave }: AddClientPanelProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [onboardingDate, setOnboardingDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name || !onboardingDate) {
      toast({ title: "Missing fields", description: "Name and onboarding date are required", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name,
        onboardingDate,
      };

      await onSave(payload);
      onClose();
      // Reset form
      setName("");
      setOnboardingDate("");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[520px] bg-card border-l border-border shadow-lg z-50 slide-up overflow-y-auto">
      <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Add New Client</h2>
            <p className="text-sm text-muted-foreground">Enter client details</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="client-name">Client Name</Label>
            <Input
              id="client-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="onboarding-date">Onboarding Date</Label>
            <Input
              id="onboarding-date"
              type="date"
              value={onboardingDate}
              onChange={(e) => setOnboardingDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-card border-t border-border p-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Creating..." : "Create Client"}
        </Button>
      </div>
    </div>
  );
}
