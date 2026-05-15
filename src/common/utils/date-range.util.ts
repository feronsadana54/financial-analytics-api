import { QueryFilterDto } from "../dto/query-filter.dto";

export function buildDateRange(filter: QueryFilterDto) {
  if (filter.startDate || filter.endDate) {
    return {
      gte: filter.startDate ? new Date(filter.startDate) : undefined,
      lte: filter.endDate ? new Date(filter.endDate) : undefined
    };
  }

  if (filter.month && filter.year) {
    const year = Number(filter.year);
    const month = Number(filter.month) - 1;
    return {
      gte: new Date(Date.UTC(year, month, 1)),
      lte: new Date(Date.UTC(year, month + 1, 0, 23, 59, 59))
    };
  }

  if (filter.year) {
    const year = Number(filter.year);
    return {
      gte: new Date(Date.UTC(year, 0, 1)),
      lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59))
    };
  }

  return undefined;
}

export function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
