import { Override, Person } from "@/types/bonus";
import { formatCurrency } from "@/lib/bonusCalculations";
import { format } from "date-fns";
import { FileEdit, ArrowRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OverrideHistoryProps {
  overrides: Override[];
  people: Person[];
  clientFilter?: string;
}

export function OverrideHistory({ overrides, people, clientFilter }: OverrideHistoryProps) {
  const filteredOverrides = clientFilter
    ? overrides.filter((o) => o.clientId === clientFilter)
    : overrides;

  const sortedOverrides = [...filteredOverrides].sort(
    (a, b) => new Date(b.approvalDate).getTime() - new Date(a.approvalDate).getTime()
  );

  if (sortedOverrides.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileEdit className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No overrides recorded</p>
      </div>
    );
  }

  const getPersonName = (personId: string | undefined) => {
    if (!personId) return "Client-level";
    return people.find((p) => p.id === personId)?.name ?? "Unknown";
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Person</TableHead>
          <TableHead className="text-right">Original</TableHead>
          <TableHead className="text-right">Override</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Approved By</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedOverrides.map((override) => (
          <TableRow key={override.id}>
            <TableCell className="text-sm">
              {format(new Date(override.approvalDate), "MMM d, yyyy")}
            </TableCell>
            <TableCell className="font-medium">
              {getPersonName(override.personId)}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {formatCurrency(override.originalAmount)}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium text-primary">
                  {formatCurrency(override.overrideAmount)}
                </span>
              </div>
            </TableCell>
            <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
              {override.reason}
            </TableCell>
            <TableCell className="text-sm">{override.approvedBy}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
