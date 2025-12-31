import { useState } from "react";
import { X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Person } from "@/types/bonus";

interface AddMemberPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (person: Omit<Person, "id">) => Promise<void>;
}

export function AddMemberPanel({ isOpen, onClose, onSave }: AddMemberPanelProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [defaultBonusWeight, setDefaultBonusWeight] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!name || !email || !role) return;
    
    setIsSubmitting(true);
    try {
      await onSave({
        name,
        email,
        role,
        defaultBonusWeight: defaultBonusWeight ? parseFloat(defaultBonusWeight) : undefined,
      });
      onClose();
      // Reset form
      setName("");
      setEmail("");
      setRole("");
      setDefaultBonusWeight("");
    } catch (error) {
      console.error("Failed to save member:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = name && email && role;

  return (
    <div className="fixed inset-y-0 right-0 w-[520px] bg-card border-l border-border shadow-lg z-50 slide-up overflow-y-auto">
      <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Add Team Member</h2>
            <p className="text-sm text-muted-foreground">Create a new team member</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g. john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Developer">Developer</SelectItem>
                <SelectItem value="Designer">Designer</SelectItem>
                <SelectItem value="Product Manager">Product Manager</SelectItem>
                <SelectItem value="Content">Content</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">Default Bonus Weight (%)</Label>
            <div className="relative">
              <Input
                id="weight"
                type="number"
                min="0"
                max="100"
                placeholder="Optional"
                value={defaultBonusWeight}
                onChange={(e) => setDefaultBonusWeight(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              This weight will be suggested when assigning to new projects.
            </p>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Member"}
          </Button>
        </div>
      </div>
    </div>
  );
}
