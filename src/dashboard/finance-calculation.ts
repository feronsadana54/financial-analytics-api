export type FinanceSummaryInput = {
  revenue: number;
  expense: number;
  grossProfit: number;
  orders: number;
  productsSold: number;
  previousRevenue: number;
  previousExpense: number;
};

export function calculateGrowth(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

export function calculateFinanceSummary(input: FinanceSummaryInput) {
  const netProfit = input.grossProfit - input.expense;
  const profitMargin = input.revenue > 0 ? (netProfit / input.revenue) * 100 : 0;
  const averageOrderValue = input.orders > 0 ? input.revenue / input.orders : 0;

  return {
    totalRevenue: Number(input.revenue.toFixed(2)),
    totalExpense: Number(input.expense.toFixed(2)),
    grossProfit: Number(input.grossProfit.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    profitMargin: Number(profitMargin.toFixed(2)),
    totalOrders: input.orders,
    totalProductsSold: input.productsSold,
    averageOrderValue: Number(averageOrderValue.toFixed(2)),
    revenueGrowth: calculateGrowth(input.revenue, input.previousRevenue),
    expenseGrowth: calculateGrowth(input.expense, input.previousExpense)
  };
}
