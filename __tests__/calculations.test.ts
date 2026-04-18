import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatDate,
  todayStr,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  isInRange,
  calcTotalEarnings,
  calcTotalKm,
  calcAvgPerKm,
  calcNetProfit,
  calcMaintenanceCost,
  calcTotalExpenses,
  calcTotalIncome,
  calcWeeklyGoal,
  calcTotalInvested,
  calcTotalExtraIncome,
  getWeeklyEarningsData,
  getEarningsByApp,
} from "@/lib/calculations";
import type { MotoEarning, Maintenance, FinancialEntry, Investment, ExtraIncome } from "@/lib/database";

describe("formatCurrency", () => {
  it("formats positive values", () => {
    expect(formatCurrency(150.5)).toBe("R$ 150,50");
  });
  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("R$ 0,00");
  });
  it("formats large values", () => {
    expect(formatCurrency(12345.67)).toBe("R$ 12345,67");
  });
});

describe("formatDate", () => {
  it("formats ISO date string", () => {
    // Date parsing may shift by timezone, so we just check format
    const result = formatDate("2026-02-13");
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });
});

describe("todayStr", () => {
  it("returns YYYY-MM-DD format", () => {
    const result = todayStr();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("date range helpers", () => {
  it("getStartOfWeek returns Monday", () => {
    const d = new Date("2026-02-13"); // Friday
    const start = getStartOfWeek(d);
    expect(start.getDay()).toBe(1); // Monday
  });

  it("getEndOfWeek returns Sunday", () => {
    const d = new Date("2026-02-13");
    const end = getEndOfWeek(d);
    expect(end.getDay()).toBe(0); // Sunday
  });

  it("getStartOfMonth returns 1st", () => {
    const d = new Date("2026-02-13");
    const start = getStartOfMonth(d);
    expect(start.getDate()).toBe(1);
  });

  it("getEndOfMonth returns last day", () => {
    const d = new Date("2026-02-13");
    const end = getEndOfMonth(d);
    expect(end.getDate()).toBe(28); // Feb 2026 has 28 days
  });
});

describe("isInRange", () => {
  it("returns true for date within range", () => {
    expect(isInRange("2026-02-10", new Date("2026-02-01"), new Date("2026-02-28"))).toBe(true);
  });
  it("returns false for date outside range", () => {
    expect(isInRange("2026-03-10", new Date("2026-02-01"), new Date("2026-02-28"))).toBe(false);
  });
});

const mockEarnings: MotoEarning[] = [
  { id: "1", appName: "iFood", value: 100, km: 50, date: "2026-02-10", createdAt: "" },
  { id: "2", appName: "99Food", value: 80, km: 30, date: "2026-02-11", createdAt: "" },
  { id: "3", appName: "iFood", value: 120, km: 60, date: "2026-02-12", createdAt: "" },
];

describe("moto calculations", () => {
  it("calcTotalEarnings sums all", () => {
    expect(calcTotalEarnings(mockEarnings)).toBe(300);
  });

  it("calcTotalEarnings filters by range", () => {
    // Only include first entry (2026-02-10)
    const result = calcTotalEarnings(mockEarnings, new Date("2026-02-10T00:00:00Z"), new Date("2026-02-10T23:59:59Z"));
    expect(result).toBe(100);
  });

  it("calcTotalKm sums all km", () => {
    expect(calcTotalKm(mockEarnings)).toBe(140);
  });

  it("calcAvgPerKm calculates correctly", () => {
    const avg = calcAvgPerKm(mockEarnings);
    expect(avg).toBeCloseTo(300 / 140, 2);
  });

  it("calcAvgPerKm returns 0 for no km", () => {
    expect(calcAvgPerKm([])).toBe(0);
  });
});

const mockMaintenance: Maintenance[] = [
  { id: "1", item: "Óleo", km: 5000, value: 50, date: "2026-02-10", createdAt: "" },
  { id: "2", item: "Pneu", km: 10000, value: 200, date: "2026-02-12", createdAt: "" },
];

describe("maintenance calculations", () => {
  it("calcMaintenanceCost sums all", () => {
    expect(calcMaintenanceCost(mockMaintenance)).toBe(250);
  });

  it("calcNetProfit subtracts costs", () => {
    const profit = calcNetProfit(mockEarnings, mockMaintenance, 0.35);
    // 300 - (140 * 0.35) - 250 = 300 - 49 - 250 = 1
    expect(profit).toBeCloseTo(1, 0);
  });
});

const mockFinancials: FinancialEntry[] = [
  { id: "1", type: "income", category: "Salário", description: "Salário", value: 1000, date: "2026-02-10", isPaid: true, isFixed: true, isInstallment: false, createdAt: "" },
  { id: "2", type: "expense", category: "Aluguel", description: "Aluguel", value: 500, date: "2026-02-10", dueDate: "2026-02-15", isPaid: false, isFixed: true, isInstallment: false, createdAt: "" },
  { id: "3", type: "expense", category: "Luz", description: "Luz", value: 150, date: "2026-02-10", dueDate: "2026-02-20", isPaid: false, isFixed: true, isInstallment: false, createdAt: "" },
];

describe("financial calculations", () => {
  it("calcTotalExpenses sums expenses", () => {
    expect(calcTotalExpenses(mockFinancials)).toBe(650);
  });

  it("calcTotalIncome sums income", () => {
    expect(calcTotalIncome(mockFinancials)).toBe(1000);
  });
});

const mockInvestments: Investment[] = [
  { id: "1", name: "CDB", value: 1000, yieldPercentage: 1, date: "2026-01-01", type: "deposit", createdAt: "" },
  { id: "2", name: "CDB", value: 500, yieldPercentage: 1, date: "2026-02-01", type: "deposit", createdAt: "" },
];

describe("investment calculations", () => {
  it("calcTotalInvested sums deposits", () => {
    expect(calcTotalInvested(mockInvestments)).toBe(1500);
  });

  it("calcTotalInvested subtracts withdrawals", () => {
    const withWithdrawal = [
      ...mockInvestments,
      { id: "3", name: "CDB", value: 200, yieldPercentage: 1, date: "2026-03-01", type: "withdrawal" as const, createdAt: "" },
    ];
    expect(calcTotalInvested(withWithdrawal)).toBe(1300);
  });
});

const mockExtraIncome: ExtraIncome[] = [
  { id: "1", name: "Frete", value: 50, date: "2026-02-10", createdAt: "" },
  { id: "2", name: "Bico", value: 80, date: "2026-02-12", createdAt: "" },
];

describe("extra income calculations", () => {
  it("calcTotalExtraIncome sums all", () => {
    expect(calcTotalExtraIncome(mockExtraIncome)).toBe(130);
  });
});

describe("chart data helpers", () => {
  it("getEarningsByApp groups correctly", () => {
    const result = getEarningsByApp(mockEarnings);
    expect(result.labels).toContain("iFood");
    expect(result.labels).toContain("99Food");
    const ifoodIdx = result.labels.indexOf("iFood");
    expect(result.data[ifoodIdx]).toBe(220);
  });
});
