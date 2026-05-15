import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { QueryFilterDto } from "../common/dto/query-filter.dto";
import { DashboardService } from "./dashboard.service";

@ApiTags("Dashboard")
@ApiBearerAuth()
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("summary")
  summary(@Query() filter: QueryFilterDto) {
    return this.dashboardService.getSummary(filter);
  }

  @Get("revenue-trend")
  revenueTrend(@Query() filter: QueryFilterDto) {
    return this.dashboardService.getRevenueTrend(filter);
  }

  @Get("profit-trend")
  profitTrend(@Query() filter: QueryFilterDto) {
    return this.dashboardService.getProfitTrend(filter);
  }

  @Get("expense-breakdown")
  expenseBreakdown(@Query() filter: QueryFilterDto) {
    return this.dashboardService.getExpenseBreakdown(filter);
  }

  @Get("product-performance")
  productPerformance(@Query() filter: QueryFilterDto) {
    return this.dashboardService.getProductPerformance(filter);
  }

  @Get("category-distribution")
  categoryDistribution(@Query() filter: QueryFilterDto) {
    return this.dashboardService.getCategoryDistribution(filter);
  }

  @Get("top-products")
  topProducts(@Query() filter: QueryFilterDto) {
    return this.dashboardService.getTopProducts(filter);
  }

  @Get("revenue-vs-expense")
  revenueVsExpense(@Query() filter: QueryFilterDto) {
    return this.dashboardService.getRevenueVsExpense(filter);
  }
}
