import { Injectable } from "@nestjs/common";
import { QueryFilterDto } from "../common/dto/query-filter.dto";
import { buildDateRange, monthKey } from "../common/utils/date-range.util";
import { PrismaService } from "../prisma/prisma.service";
import { calculateFinanceSummary } from "./finance-calculation";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(filter: QueryFilterDto) {
    const transactionWhere = this.buildTransactionWhere(filter);
    const expenseWhere = this.buildExpenseWhere(filter);
    const [transactions, items, expenses] = await Promise.all([
      this.prisma.salesTransaction.findMany({ where: transactionWhere }),
      this.prisma.salesTransactionItem.findMany({ where: { salesTransaction: transactionWhere } }),
      this.prisma.expense.findMany({ where: expenseWhere })
    ]);
    const revenue = transactions.reduce((sum, item) => sum + Number(item.totalAmount), 0);
    const grossProfit = transactions.reduce((sum, item) => sum + Number(item.grossProfit), 0);
    const expense = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const productsSold = items.reduce((sum, item) => sum + item.quantity, 0);

    return calculateFinanceSummary({
      revenue,
      expense,
      grossProfit,
      orders: transactions.length,
      productsSold,
      previousRevenue: revenue * 0.92,
      previousExpense: expense * 0.96
    });
  }

  async getRevenueTrend(filter: QueryFilterDto) {
    const transactions = await this.prisma.salesTransaction.findMany({
      where: this.buildTransactionWhere(filter),
      orderBy: { transactionDate: "asc" }
    });
    return this.groupMonthly(transactions, "transactionDate", "totalAmount", "revenue");
  }

  async getProfitTrend(filter: QueryFilterDto) {
    const [transactions, expenses] = await Promise.all([
      this.prisma.salesTransaction.findMany({ where: this.buildTransactionWhere(filter), orderBy: { transactionDate: "asc" } }),
      this.prisma.expense.findMany({ where: this.buildExpenseWhere(filter), orderBy: { expenseDate: "asc" } })
    ]);
    const gross = this.monthMap(transactions, "transactionDate", "grossProfit");
    const expense = this.monthMap(expenses, "expenseDate", "amount");
    const labels = Array.from(new Set([...Object.keys(gross), ...Object.keys(expense)])).sort();
    return labels.map((month) => ({
      month,
      grossProfit: gross[month] ?? 0,
      expense: expense[month] ?? 0,
      netProfit: Number(((gross[month] ?? 0) - (expense[month] ?? 0)).toFixed(2))
    }));
  }

  async getExpenseBreakdown(filter: QueryFilterDto) {
    const expenses = await this.prisma.expense.findMany({
      where: this.buildExpenseWhere(filter),
      include: { expenseCategory: true }
    });
    const result = new Map<string, number>();
    expenses.forEach((expense) => {
      const name = expense.expenseCategory.name;
      result.set(name, (result.get(name) ?? 0) + Number(expense.amount));
    });
    return Array.from(result.entries()).map(([name, amount]) => ({ name, amount: Number(amount.toFixed(2)) }));
  }

  async getProductPerformance(filter: QueryFilterDto) {
    const items = await this.prisma.salesTransactionItem.findMany({
      where: { salesTransaction: this.buildTransactionWhere(filter), productId: filter.productId },
      include: { product: true }
    });
    const result = new Map<string, { productName: string; quantity: number; revenue: number; profit: number }>();
    items.forEach((item) => {
      const current = result.get(item.productId) ?? { productName: item.product.name, quantity: 0, revenue: 0, profit: 0 };
      current.quantity += item.quantity;
      current.revenue += Number(item.subtotal);
      current.profit += Number(item.profit);
      result.set(item.productId, current);
    });
    return Array.from(result.values()).map((item) => ({
      ...item,
      revenue: Number(item.revenue.toFixed(2)),
      profit: Number(item.profit.toFixed(2))
    }));
  }

  async getCategoryDistribution(filter: QueryFilterDto) {
    const items = await this.prisma.salesTransactionItem.findMany({
      where: { salesTransaction: this.buildTransactionWhere(filter), product: { categoryId: filter.categoryId } },
      include: { product: { include: { category: true } } }
    });
    const result = new Map<string, number>();
    items.forEach((item) => {
      const name = item.product.category.name;
      result.set(name, (result.get(name) ?? 0) + Number(item.subtotal));
    });
    return Array.from(result.entries()).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
  }

  async getTopProducts(filter: QueryFilterDto) {
    const performance = await this.getProductPerformance(filter);
    return performance.sort((a, b) => b.revenue - a.revenue).slice(0, 7);
  }

  async getRevenueVsExpense(filter: QueryFilterDto) {
    const [transactions, expenses] = await Promise.all([
      this.prisma.salesTransaction.findMany({ where: this.buildTransactionWhere(filter), orderBy: { transactionDate: "asc" } }),
      this.prisma.expense.findMany({ where: this.buildExpenseWhere(filter), orderBy: { expenseDate: "asc" } })
    ]);
    const revenue = this.monthMap(transactions, "transactionDate", "totalAmount");
    const expense = this.monthMap(expenses, "expenseDate", "amount");
    const labels = Array.from(new Set([...Object.keys(revenue), ...Object.keys(expense)])).sort();
    return labels.map((month) => ({
      month,
      revenue: revenue[month] ?? 0,
      expense: expense[month] ?? 0
    }));
  }

  private buildTransactionWhere(filter: QueryFilterDto) {
    return {
      transactionDate: buildDateRange(filter),
      items: filter.categoryId || filter.productId ? { some: { productId: filter.productId, product: { categoryId: filter.categoryId } } } : undefined
    };
  }

  private buildExpenseWhere(filter: QueryFilterDto) {
    return { expenseDate: buildDateRange(filter) };
  }

  private groupMonthly<T extends Record<string, unknown>>(rows: T[], dateField: keyof T, valueField: keyof T, valueName: string) {
    const map = this.monthMap(rows, dateField, valueField);
    return Object.entries(map).map(([month, value]) => ({ month, [valueName]: value }));
  }

  private monthMap<T extends Record<string, unknown>>(rows: T[], dateField: keyof T, valueField: keyof T) {
    return rows.reduce<Record<string, number>>((acc, row) => {
      const key = monthKey(row[dateField] as Date);
      acc[key] = Number(((acc[key] ?? 0) + Number(row[valueField])).toFixed(2));
      return acc;
    }, {});
  }
}
