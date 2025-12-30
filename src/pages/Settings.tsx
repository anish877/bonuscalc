import { useState } from "react";
import { Layout } from "@/components/Layout";
import { SectionHeader } from "@/components/SectionHeader";
import { mockSettings } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatPercentage } from "@/lib/bonusCalculations";
import { Save, Plus, Trash2, Percent, DollarSign, Info } from "lucide-react";
import { toast } from "sonner";

const SettingsPage = () => {
  const [expenseRate, setExpenseRate] = useState(
    mockSettings.companyExpensePercentage
  );
  const [slabs, setSlabs] = useState(mockSettings.bonusSlabs);

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  const addSlab = () => {
    const lastSlab = slabs[slabs.length - 1];
    const newMin = lastSlab?.maxRevenue ? lastSlab.maxRevenue + 1 : 0;
    setSlabs([
      ...slabs,
      {
        id: `slab${Date.now()}`,
        minRevenue: newMin,
        maxRevenue: null,
        bonusPercentage: 10,
      },
    ]);
  };

  const removeSlab = (id: string) => {
    if (slabs.length <= 1) {
      toast.error("At least one slab is required");
      return;
    }
    setSlabs(slabs.filter((s) => s.id !== id));
  };

  const updateSlab = (
    id: string,
    field: "minRevenue" | "maxRevenue" | "bonusPercentage",
    value: number | null
  ) => {
    setSlabs(
      slabs.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-3xl">
        <SectionHeader
          title="Settings"
          description="Configure bonus calculation parameters"
        />

        {/* Company Expense */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Percent className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Company Expense Rate</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Percentage deducted from average monthly revenue before bonus
                calculation
              </p>
              <div className="flex items-center gap-3">
                <div className="relative w-32">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={expenseRate}
                    onChange={(e) => setExpenseRate(Number(e.target.value))}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    %
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Net revenue = {100 - expenseRate}% of average monthly revenue
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bonus Slabs */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Bonus Rate Slabs</h3>
              <p className="text-sm text-muted-foreground">
                Define bonus percentages based on average monthly revenue tiers
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {slabs.map((slab, index) => (
              <div
                key={slab.id}
                className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg"
              >
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Min Revenue
                    </Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        value={slab.minRevenue}
                        onChange={(e) =>
                          updateSlab(slab.id, "minRevenue", Number(e.target.value))
                        }
                        className="pl-7"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Max Revenue
                    </Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        value={slab.maxRevenue ?? ""}
                        placeholder="No limit"
                        onChange={(e) =>
                          updateSlab(
                            slab.id,
                            "maxRevenue",
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        className="pl-7"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Bonus Rate
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={slab.bonusPercentage}
                        onChange={(e) =>
                          updateSlab(
                            slab.id,
                            "bonusPercentage",
                            Number(e.target.value)
                          )
                        }
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSlab(slab.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button variant="outline" onClick={addSlab} className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Add Slab
          </Button>
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-primary">How slabs work</p>
            <p className="text-muted-foreground mt-1">
              The system checks average monthly revenue against each slab. Revenue
              ≤$5,000 gets 20% bonus rate, while revenue &gt;$5,000 gets 10%. The
              bonus is calculated on net revenue (after expense deduction).
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
