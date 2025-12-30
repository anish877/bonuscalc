import { Person, ClientBonusCalculation } from "@/types/bonus";
import { getPersonTotalBonus, formatCurrency } from "@/lib/bonusCalculations";
import { ChevronRight } from "lucide-react";

interface TeamTableProps {
  people: Person[];
  calculations: ClientBonusCalculation[];
}

export function TeamTable({ people, calculations }: TeamTableProps) {
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
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
