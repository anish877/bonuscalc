import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { SectionHeader } from "@/components/SectionHeader";
import { ClientTable } from "@/components/ClientTable";
import { EditableAllocationPanel } from "@/components/EditableAllocationPanel";
import { AddClientPanel } from "@/components/AddClientPanel";
import { AddRevenuePanel } from "@/components/AddRevenuePanel";
import { ClientBonusHistory } from "@/components/ClientBonusHistory";
import { useClientData } from "@/hooks/useClientData";
import { Button } from "@/components/ui/button";
import { Plus, Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { exportBonusCalculations, exportBonusHistory } from "@/lib/exportUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

const Clients = () => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [revenueClientId, setRevenueClientId] = useState<string | null>(null);
  const [historyClientId, setHistoryClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { toast } = useToast();

  const {
    clients,
    people,
    settings,
    calculations,
    bonusHistory,
    overrides,
    updateClientAllocations,
    updateClientRevenue,
    getClientById,
    getClientBonusHistory,
    addOverride,
    getClientOverrides,
    addClient,
    processPayout,
    fetchBonusHistory,
    isLoading,
    isHistoryLoading,
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
  const revenueClient = revenueClientId ? getClientById(revenueClientId) : null;

  const historyClient = historyClientId ? getClientById(historyClientId) : null;
  const clientHistory = historyClientId ? getClientBonusHistory(historyClientId) : [];

  const selectedClientOverrides = selectedClientId ? getClientOverrides(selectedClientId) : [];

  useEffect(() => {
    if (historyClientId) {
      // Refresh history when drawer opens
      fetchBonusHistory();
    }
  }, [historyClientId, fetchBonusHistory]);

  return (
    <Layout>
      <div className="space-y-6">
        <SectionHeader
          title="Clients"
          description="Manage client revenue and bonus allocations"
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
                  <DropdownMenuItem onClick={() => exportBonusCalculations(calculations, overrides)}>
                    Export Current Calculations
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportBonusHistory(bonusHistory)}>
                    Export Full History
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button className="gap-2" onClick={() => setIsAddOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Client
              </Button>
            </div>
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
          isLoading={isLoading}
        />
      </div>

      {/* Editable Detail Panel */}
      <EditableAllocationPanel
        calculation={selectedCalculation}
        client={selectedClient ?? null}
        people={people}
        settings={settings}
        overrides={selectedClientOverrides}
        onClose={() => setSelectedClientId(null)}
        onSave={updateClientAllocations}
        onViewHistory={(clientId) => {
          setSelectedClientId(null);
          setHistoryClientId(clientId);
        }}
        onEditRevenue={(clientId) => {
          setSelectedClientId(null);
          setRevenueClientId(clientId);
        }}
        onAddOverride={addOverride}
        onProcessPayout={processPayout}
      />

      {/* Revenue Panel */}
      <AddRevenuePanel
        isOpen={!!revenueClientId}
        client={revenueClient}
        onClose={() => setRevenueClientId(null)}
        onSave={async (clientId, revenue) => {
          await updateClientRevenue(clientId, revenue);
        }}
      />

      {/* Client History Panel */}
      {historyClientId && historyClient && (
        <ClientBonusHistory
          clientName={historyClient.name}
          history={clientHistory}
          onClose={() => setHistoryClientId(null)}
          isLoading={isHistoryLoading}
        />
      )}

      {/* Overlay */}
      {(selectedClientId || historyClientId || isAddOpen || revenueClientId) && (
        <div
          className="fixed inset-0 bg-foreground/10 z-40"
          onClick={() => {
            setSelectedClientId(null);
            setHistoryClientId(null);
            setIsAddOpen(false);
            setRevenueClientId(null);
          }}
        />
      )}
      {/* Add Client Drawer */}
      <AddClientPanel
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={async (payload) => {
          try {
            const created = await addClient(payload);
            if (created) {
              toast({ title: "Client added", description: created.name });
            }
          } catch (err) {
            console.error("Failed to add client", err);
            toast({ 
              title: "Error", 
              description: "Failed to add client", 
              variant: "destructive" 
            });
          }
        }}
      />
    </Layout>
  );
};

export default Clients;
