import { useMemo, useState, useEffect } from "react";
import { AddMemberPanel } from "@/components/AddMemberPanel";
import { Layout } from "@/components/Layout";
import { SectionHeader } from "@/components/SectionHeader";
import { TeamTable } from "@/components/TeamTable";
import { PersonBonusHistory } from "@/components/PersonBonusHistory";
import { useClientData } from "@/hooks/useClientData";
import { Button } from "@/components/ui/button";
import { Plus, Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { exportTeamSummary, exportBonusHistory } from "@/lib/exportUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Team = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const { people, calculations, bonusHistory, getPersonBonusHistory, addPerson, fetchBonusHistory, isLoading, isHistoryLoading } = useClientData();

  const filteredPeople = useMemo(() => {
    if (!searchQuery) return people;
    return people.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, people]);

  const selectedPerson = selectedPersonId
    ? people.find((p) => p.id === selectedPersonId) ?? null
    : null;

  const personHistory = selectedPersonId ? getPersonBonusHistory(selectedPersonId) : [];

  useEffect(() => {
    if (selectedPersonId) {
      // Refresh history when drawer opens
      fetchBonusHistory();
    }
  }, [selectedPersonId, fetchBonusHistory]);

  return (
    <Layout>
      <div className="space-y-6">
        <SectionHeader
          title="Team"
          description="Manage team members and their bonus allocations"
          action={
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportTeamSummary(calculations, people)}>
                    Export Team Summary
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportBonusHistory(bonusHistory)}>
                    Export Full History
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button className="gap-2" onClick={() => setIsAddMemberOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Member
              </Button>
            </div>
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
        <TeamTable
          people={filteredPeople}
          calculations={calculations}
          onPersonClick={setSelectedPersonId}
          isLoading={isLoading}
        />
      </div>

      {/* Person History Panel */}
      <PersonBonusHistory
        person={selectedPerson}
        history={personHistory}
        onClose={() => setSelectedPersonId(null)}
        isLoading={isHistoryLoading}
      />

      {/* Add Member Panel */}
      <AddMemberPanel
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onSave={addPerson}
      />

      {/* Overlay */}
      {(selectedPersonId || isAddMemberOpen) && (
        <div
          className="fixed inset-0 bg-foreground/10 z-40"
          onClick={() => {
            setSelectedPersonId(null);
            setIsAddMemberOpen(false);
          }}
        />
      )}
    </Layout>
  );
};

export default Team;
