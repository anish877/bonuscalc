import { ClientBonusCalculation, BonusHistoryRecord, Override, Person } from "@/types/bonus";
import { format } from "date-fns";

// Generate CSV content from data
function generateCSV(headers: string[], rows: string[][]): string {
  const escapeCell = (cell: string | number): string => {
    const str = String(cell);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escapeCell).join(",");
  const dataRows = rows.map((row) => row.map(escapeCell).join(",")).join("\n");

  return `${headerRow}\n${dataRows}`;
}

// Download file utility
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export current bonus calculations
export function exportBonusCalculations(
  calculations: ClientBonusCalculation[],
  overrides: Override[]
): void {
  const headers = [
    "Client",
    "Eligible Months",
    "Total Revenue (6mo)",
    "Avg Monthly Revenue",
    "Expense Deduction",
    "Net Revenue",
    "Bonus %",
    "Total Bonus Pool",
    "Team Member",
    "Weight %",
    "Calculated Bonus",
    "Override Amount",
    "Final Bonus",
  ];

  const rows: string[][] = [];

  calculations.forEach((calc) => {
    calc.allocations.forEach((alloc) => {
      const override = overrides.find(
        (o) => o.clientId === calc.clientId && o.personId === alloc.personId
      );
      const finalAmount = override ? override.overrideAmount : alloc.bonusAmount;

      rows.push([
        calc.clientName,
        String(calc.eligibleMonths),
        calc.totalRevenue.toFixed(2),
        calc.averageMonthlyRevenue.toFixed(2),
        calc.expenseDeduction.toFixed(2),
        calc.netRevenue.toFixed(2),
        `${calc.appliedBonusPercentage}%`,
        calc.totalBonusPool.toFixed(2),
        alloc.personName,
        `${alloc.weight}%`,
        alloc.bonusAmount.toFixed(2),
        override ? override.overrideAmount.toFixed(2) : "",
        finalAmount.toFixed(2),
      ]);
    });
  });

  const csv = generateCSV(headers, rows);
  const date = format(new Date(), "yyyy-MM-dd");
  downloadFile(csv, `bonus-calculations-${date}.csv`, "text/csv;charset=utf-8");
}

// Export bonus history
export function exportBonusHistory(history: BonusHistoryRecord[]): void {
  const headers = [
    "Period",
    "Calculated Date",
    "Client",
    "Team Member",
    "Weight %",
    "Avg Monthly Revenue",
    "Bonus %",
    "Total Client Bonus",
    "Individual Bonus",
  ];

  const rows: string[][] = history.map((record) => [
    record.period,
    format(new Date(record.calculatedAt), "yyyy-MM-dd"),
    record.clientName,
    record.personName,
    `${record.weight}%`,
    record.averageMonthlyRevenue.toFixed(2),
    `${record.appliedBonusPercentage}%`,
    record.totalClientBonus.toFixed(2),
    record.bonusAmount.toFixed(2),
  ]);

  const csv = generateCSV(headers, rows);
  const date = format(new Date(), "yyyy-MM-dd");
  downloadFile(csv, `bonus-history-${date}.csv`, "text/csv;charset=utf-8");
}

// Export person-specific bonus history
export function exportPersonBonusHistory(
  personName: string,
  history: BonusHistoryRecord[]
): void {
  const headers = [
    "Period",
    "Client",
    "Weight %",
    "Bonus Amount",
  ];

  const rows: string[][] = history.map((record) => [
    record.period,
    record.clientName,
    `${record.weight}%`,
    record.bonusAmount.toFixed(2),
  ]);

  const csv = generateCSV(headers, rows);
  const date = format(new Date(), "yyyy-MM-dd");
  const safeName = personName.replace(/\s+/g, "-").toLowerCase();
  downloadFile(csv, `bonus-history-${safeName}-${date}.csv`, "text/csv;charset=utf-8");
}

// Export override history
export function exportOverrides(overrides: Override[], people: Person[]): void {
  const headers = [
    "Approval Date",
    "Client ID",
    "Person",
    "Original Amount",
    "Override Amount",
    "Difference",
    "Reason",
    "Approved By",
  ];

  const getPersonName = (personId: string | undefined) =>
    personId ? people.find((p) => p.id === personId)?.name ?? "Unknown" : "Client-level";

  const rows: string[][] = overrides.map((o) => [
    format(new Date(o.approvalDate), "yyyy-MM-dd"),
    o.clientId,
    getPersonName(o.personId),
    o.originalAmount.toFixed(2),
    o.overrideAmount.toFixed(2),
    (o.overrideAmount - o.originalAmount).toFixed(2),
    o.reason,
    o.approvedBy,
  ]);

  const csv = generateCSV(headers, rows);
  const date = format(new Date(), "yyyy-MM-dd");
  downloadFile(csv, `bonus-overrides-${date}.csv`, "text/csv;charset=utf-8");
}

// Export team summary
export function exportTeamSummary(
  calculations: ClientBonusCalculation[],
  people: Person[]
): void {
  const headers = ["Team Member", "Role", "Email", "Total Bonus", "Client Count"];

  // Aggregate by person
  const personTotals = new Map<string, { total: number; clientCount: number }>();

  calculations.forEach((calc) => {
    calc.allocations.forEach((alloc) => {
      const current = personTotals.get(alloc.personId) || { total: 0, clientCount: 0 };
      personTotals.set(alloc.personId, {
        total: current.total + alloc.bonusAmount,
        clientCount: current.clientCount + 1,
      });
    });
  });

  const rows: string[][] = people
    .map((person) => {
      const data = personTotals.get(person.id);
      return [
        person.name,
        person.role,
        person.email,
        data ? data.total.toFixed(2) : "0.00",
        data ? String(data.clientCount) : "0",
      ];
    })
    .filter((row) => parseFloat(row[3]) > 0);

  const csv = generateCSV(headers, rows);
  const date = format(new Date(), "yyyy-MM-dd");
  downloadFile(csv, `team-bonus-summary-${date}.csv`, "text/csv;charset=utf-8");
}
