import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, Role, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { AuthenticatedUser } from "../auth/types/authenticated-user";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

const PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({ select: PUBLIC_SELECT, orderBy: { createdAt: "desc" } });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: PUBLIC_SELECT });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async create(actor: AuthenticatedUser, dto: CreateUserDto) {
    if (dto.role && dto.role === Role.SUPER_ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException("Only super admin can create another super admin");
    }
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException("Email is already registered");

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        password: passwordHash,
        role: dto.role ?? Role.USER,
        status: dto.status ?? UserStatus.ACTIVE
      },
      select: PUBLIC_SELECT
    });
  }

  async update(actor: AuthenticatedUser, id: string, dto: UpdateUserDto) {
    const target = await this.requireUser(id);
    this.guardSuperAdminMutation(actor, target.role);

    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) {
      const normalized = dto.email.toLowerCase();
      if (normalized !== target.email) {
        const existing = await this.prisma.user.findUnique({ where: { email: normalized } });
        if (existing) throw new ConflictException("Email is already registered");
        data.email = normalized;
      }
    }
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({ where: { id }, data, select: PUBLIC_SELECT });
  }

  async updateRole(actor: AuthenticatedUser, id: string, dto: UpdateRoleDto) {
    const target = await this.requireUser(id);
    if (actor.id === id) throw new BadRequestException("You cannot change your own role");
    this.guardSuperAdminMutation(actor, target.role);
    if (dto.role === Role.SUPER_ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException("Only super admin can assign super admin role");
    }
    return this.prisma.user.update({ where: { id }, data: { role: dto.role }, select: PUBLIC_SELECT });
  }

  async updateStatus(actor: AuthenticatedUser, id: string, dto: UpdateStatusDto) {
    const target = await this.requireUser(id);
    if (actor.id === id) throw new BadRequestException("You cannot change your own status");
    this.guardSuperAdminMutation(actor, target.role);
    return this.prisma.user.update({ where: { id }, data: { status: dto.status }, select: PUBLIC_SELECT });
  }

  async deactivate(actor: AuthenticatedUser, id: string) {
    const target = await this.requireUser(id);
    if (actor.id === id) throw new BadRequestException("You cannot deactivate your own account");
    this.guardSuperAdminMutation(actor, target.role);
    return this.prisma.user.update({ where: { id }, data: { status: UserStatus.INACTIVE }, select: PUBLIC_SELECT });
  }

  private async requireUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  private guardSuperAdminMutation(actor: AuthenticatedUser, targetRole: Role) {
    if (targetRole === Role.SUPER_ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException("You are not allowed to modify a super admin");
    }
  }
}
