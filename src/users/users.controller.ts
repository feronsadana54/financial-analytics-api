import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedUser } from "../auth/types/authenticated-user";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@ApiTags("Users")
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateUserDto) {
    return this.usersService.create(user, dto);
  }

  @Patch(":id")
  @Roles(Role.SUPER_ADMIN)
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user, id, dto);
  }

  @Patch(":id/role")
  @Roles(Role.SUPER_ADMIN)
  updateRole(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateRoleDto) {
    return this.usersService.updateRole(user, id, dto);
  }

  @Patch(":id/status")
  @Roles(Role.SUPER_ADMIN)
  updateStatus(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateStatusDto) {
    return this.usersService.updateStatus(user, id, dto);
  }

  @Delete(":id")
  @Roles(Role.SUPER_ADMIN)
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.usersService.deactivate(user, id);
  }
}
