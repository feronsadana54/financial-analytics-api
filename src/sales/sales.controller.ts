import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { UpdateSaleDto } from "./dto/update-sale.dto";
import { SalesService } from "./sales.service";

@ApiTags("Sales")
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller("sales")
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  findAll() {
    return this.salesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.salesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSaleDto) {
    return this.salesService.create(dto);
  }

  @Patch(":id")
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  update(@Param("id") id: string, @Body() dto: UpdateSaleDto) {
    return this.salesService.update(id, dto);
  }

  @Delete(":id")
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  remove(@Param("id") id: string) {
    return this.salesService.remove(id);
  }
}
