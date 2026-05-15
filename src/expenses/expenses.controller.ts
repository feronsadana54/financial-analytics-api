import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { ExpensesService } from "./expenses.service";

@ApiTags("Expenses")
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller("expenses")
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll() {
    return this.expensesService.findAll();
  }

  @Get("categories")
  findCategories() {
    return this.expensesService.findCategories();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.expensesService.findOne(id);
  }

  @Post()
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  create(@Body() dto: CreateExpenseDto) {
    return this.expensesService.create(dto);
  }

  @Patch(":id")
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  update(@Param("id") id: string, @Body() dto: UpdateExpenseDto) {
    return this.expensesService.update(id, dto);
  }

  @Delete(":id")
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  remove(@Param("id") id: string) {
    return this.expensesService.remove(id);
  }
}
