import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { Role, UserStatus } from "@prisma/client";
import { UsersService } from "../src/users/users.service";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
};

function buildPrisma(records: UserRecord[]) {
  return {
    user: {
      findUnique: jest.fn(async ({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id) return records.find((entry) => entry.id === where.id) ?? null;
        if (where.email) return records.find((entry) => entry.email === where.email) ?? null;
        return null;
      }),
      update: jest.fn(async ({ where, data }: { where: { id: string }; data: Partial<UserRecord> }) => {
        const target = records.find((entry) => entry.id === where.id)!;
        Object.assign(target, data);
        return target;
      })
    }
  };
}

describe("UsersService", () => {
  const baseDate = new Date("2026-01-01");
  const superAdmin = { id: "sa1", role: Role.SUPER_ADMIN, email: "sa@x.com", name: "SA" };
  const manager = { id: "m1", role: Role.MANAGER, email: "m@x.com", name: "Manager" };

  it("blocks manager from changing super admin role", async () => {
    const records: UserRecord[] = [
      { id: "sa-target", name: "Target SA", email: "target@x.com", password: "h", role: Role.SUPER_ADMIN, status: UserStatus.ACTIVE, createdAt: baseDate, updatedAt: baseDate }
    ];
    const service = new UsersService(buildPrisma(records) as never);

    await expect(service.updateRole(manager, "sa-target", { role: Role.USER })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("blocks self role change", async () => {
    const records: UserRecord[] = [
      { id: superAdmin.id, name: "SA", email: superAdmin.email, password: "h", role: Role.SUPER_ADMIN, status: UserStatus.ACTIVE, createdAt: baseDate, updatedAt: baseDate }
    ];
    const service = new UsersService(buildPrisma(records) as never);

    await expect(service.updateRole(superAdmin, superAdmin.id, { role: Role.USER })).rejects.toBeInstanceOf(BadRequestException);
  });

  it("blocks non super admin from promoting user to super admin", async () => {
    const records: UserRecord[] = [
      { id: "u1", name: "User", email: "u@x.com", password: "h", role: Role.USER, status: UserStatus.ACTIVE, createdAt: baseDate, updatedAt: baseDate }
    ];
    const service = new UsersService(buildPrisma(records) as never);

    await expect(service.updateRole(manager, "u1", { role: Role.SUPER_ADMIN })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("super admin can promote a user to manager", async () => {
    const records: UserRecord[] = [
      { id: "u1", name: "User", email: "u@x.com", password: "h", role: Role.USER, status: UserStatus.ACTIVE, createdAt: baseDate, updatedAt: baseDate }
    ];
    const service = new UsersService(buildPrisma(records) as never);

    const updated = await service.updateRole(superAdmin, "u1", { role: Role.MANAGER });
    expect(updated.role).toBe(Role.MANAGER);
  });

  it("deactivate soft-deletes by setting status INACTIVE", async () => {
    const records: UserRecord[] = [
      { id: "u1", name: "User", email: "u@x.com", password: "h", role: Role.USER, status: UserStatus.ACTIVE, createdAt: baseDate, updatedAt: baseDate }
    ];
    const service = new UsersService(buildPrisma(records) as never);

    const updated = await service.deactivate(superAdmin, "u1");
    expect(updated.status).toBe(UserStatus.INACTIVE);
  });
});
