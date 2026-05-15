import { calculateFinanceSummary, calculateGrowth } from "../src/dashboard/finance-calculation";

describe("finance calculation", () => {
  it("calculates summary metrics", () => {
    const result = calculateFinanceSummary({
      revenue: 100000,
      expense: 22000,
      grossProfit: 46000,
      orders: 20,
      productsSold: 140,
      previousRevenue: 80000,
      previousExpense: 20000
    });

    expect(result.netProfit).toBe(24000);
    expect(result.profitMargin).toBe(24);
    expect(result.averageOrderValue).toBe(5000);
    expect(result.revenueGrowth).toBe(25);
    expect(result.expenseGrowth).toBe(10);
  });

  it("handles zero previous value", () => {
    expect(calculateGrowth(500, 0)).toBe(100);
    expect(calculateGrowth(0, 0)).toBe(0);
  });
});
