import { useMemo } from "react";
import { Layout } from "@/components/Layout";
import { SectionHeader } from "@/components/SectionHeader";
import { TeamTable } from "@/components/TeamTable";
import { mockClients, mockPeople, mockSettings } from "@/data/mockData";
import { calculateAllBonuses } from "@/lib/bonusCalculations";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const Team = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const calculations = useMemo(
    () => calculateAllBonuses(mockClients, mockSettings, mockPeople),
    []
  );

  const filteredPeople = useMemo(() => {
    if (!searchQuery) return mockPeople;
    return mockPeople.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <Layout>
      <div className="space-y-6">
        <SectionHeader
          title="Team"
          description="Manage team members and their bonus allocations"
          action={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Member
            </Button>
          }
        />

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <TeamTable people={filteredPeople} calculations={calculations} />
      </div>
    </Layout>
  );
};

export default Team;
