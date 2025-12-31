import { Person, ClientBonusCalculation } from "@/types/bonus";
import { getPersonTotalBonus, formatCurrency } from "@/lib/bonusCalculations";
import { ChevronRight, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TeamTableProps {
  people: Person[];
  calculations: ClientBonusCalculation[];
  onPersonClick?: (personId: string) => void;
  isLoading?: boolean;
}

export function TeamTable({ people, calculations, onPersonClick, isLoading }: TeamTableProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Team Member</th>
              <th>Role</th>
              <th className="text-center">Clients</th>
              <th className="text-right">Total Bonus</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                </td>
                <td><Skeleton className="h-4 w-24" /></td>
                <td className="text-center"><div className="flex justify-center"><Skeleton className="h-6 w-8 rounded-full" /></div></td>
                <td className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></td>
                <td><Skeleton className="h-4 w-4" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const teamBonuses = people.map((person) => ({
    person,
    totalBonus: getPersonTotalBonus(person.id, calculations),
    clientCount: calculations.filter((c) =>
      c.allocations.some((a) => a.personId === person.id)
    ).length,
  }));

  // Sort by total bonus descending
  teamBonuses.sort((a, b) => b.totalBonus - a.totalBonus);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="data-table">
        <thead>
          <tr>
            <th>Team Member</th>
            <th>Role</th>
            <th className="text-center">Clients</th>
            <th className="text-right">Total Bonus</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {teamBonuses.map(({ person, totalBonus, clientCount }) => (
            <tr
              key={person.id}
              className="transition-colors hover:bg-muted/50 cursor-pointer"
              onClick={() => onPersonClick?.(person.id)}
            >
              <td>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-accent">
                      {person.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{person.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {person.email}
                    </p>
                  </div>
                </div>
              </td>
              <td className="text-muted-foreground">{person.role}</td>
              <td className="text-center">
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-muted text-sm">
                  {clientCount}
                </span>
              </td>
              <td className="text-right">
                <span className="font-semibold text-success">
                  {formatCurrency(totalBonus)}
                </span>
              </td>
              <td>
                <div className="flex items-center gap-1">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
