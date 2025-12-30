import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { SectionHeader } from "@/components/SectionHeader";
import { ClientTable } from "@/components/ClientTable";
import { EditableAllocationPanel } from "@/components/EditableAllocationPanel";
import { ClientBonusHistory } from "@/components/ClientBonusHistory";
import { useClientData } from "@/hooks/useClientData";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const Clients = () => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [historyClientId, setHistoryClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    clients,
    people,
    settings,
    calculations,
    updateClientAllocations,
    getClientById,
    getClientBonusHistory,
  } = useClientData();

  const filteredCalculations = useMemo(() => {
    if (!searchQuery) return calculations;
    return calculations.filter((c) =>
      c.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [calculations, searchQuery]);

  const selectedCalculation = useMemo(
    () => calculations.find((c) => c.clientId === selectedClientId) ?? null,
    [calculations, selectedClientId]
  );

  const selectedClient = selectedClientId ? getClientById(selectedClientId) : null;

  const historyClient = historyClientId ? getClientById(historyClientId) : null;
  const clientHistory = historyClientId ? getClientBonusHistory(historyClientId) : [];

  return (
    <Layout>
      <div className="space-y-6">
        <SectionHeader
          title="Clients"
          description="Manage client revenue and bonus allocations"
          action={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          }
        />

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <ClientTable
          calculations={filteredCalculations}
          onClientClick={setSelectedClientId}
        />
      </div>

      {/* Editable Detail Panel */}
      <EditableAllocationPanel
        calculation={selectedCalculation}
        client={selectedClient ?? null}
        people={people}
        settings={settings}
        onClose={() => setSelectedClientId(null)}
        onSave={updateClientAllocations}
        onViewHistory={(clientId) => {
          setSelectedClientId(null);
          setHistoryClientId(clientId);
        }}
      />

      {/* Client History Panel */}
      {historyClientId && historyClient && (
        <ClientBonusHistory
          clientName={historyClient.name}
          history={clientHistory}
          onClose={() => setHistoryClientId(null)}
        />
      )}

      {/* Overlay */}
      {(selectedClientId || historyClientId) && (
        <div
          className="fixed inset-0 bg-foreground/10 z-40"
          onClick={() => {
            setSelectedClientId(null);
            setHistoryClientId(null);
          }}
        />
      )}
    </Layout>
  );
};

export default Clients;
