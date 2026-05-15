import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.expense.findMany({ include: { expenseCategory: true }, orderBy: { expenseDate: "desc" } });
  }

  findCategories() {
    return this.prisma.expenseCategory.findMany({ orderBy: { name: "asc" } });
  }

  async findOne(id: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id }, include: { expenseCategory: true } });
    if (!expense) throw new NotFoundException("Expense not found");
    return expense;
  }

  create(dto: CreateExpenseDto) {
    return this.prisma.expense.create({ data: { ...dto, expenseDate: new Date(dto.expenseDate) }, include: { expenseCategory: true } });
  }

  async update(id: string, dto: UpdateExpenseDto) {
    await this.findOne(id);
    return this.prisma.expense.update({
      where: { id },
      data: { ...dto, expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined },
      include: { expenseCategory: true }
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.expense.delete({ where: { id } });
    return { id };
  }
}
