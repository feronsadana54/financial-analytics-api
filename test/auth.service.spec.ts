import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Role, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { AuthService } from "../src/auth/auth.service";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  status: UserStatus;
};

function createPrismaMock(records: UserRecord[] = []) {
  return {
    user: {
      findUnique: jest.fn(async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email) return records.find((entry) => entry.email === where.email) ?? null;
        if (where.id) return records.find((entry) => entry.id === where.id) ?? null;
        return null;
      }),
      create: jest.fn(async ({ data }: { data: Omit<UserRecord, "id"> }) => {
        const record = { ...data, id: `user-${records.length + 1}` };
        records.push(record);
        return record;
      })
    }
  };
}

describe("AuthService", () => {
  const jwtService = new JwtService({ secret: "test-secret" });

  it("hashes password and signs token on register", async () => {
    const prisma = createPrismaMock();
    const service = new AuthService(prisma as never, jwtService);

    const result = await service.register({ name: "Jane Doe", email: "Jane@Example.com", password: "Password123" });

    expect(result.accessToken).toBeTruthy();
    expect(result.user.email).toBe("jane@example.com");
    expect(result.user.role).toBe(Role.USER);
    const stored = prisma.user.create.mock.calls[0][0].data.password;
    expect(stored).not.toBe("Password123");
    expect(await bcrypt.compare("Password123", stored)).toBe(true);
  });

  it("rejects login with wrong password", async () => {
    const passwordHash = await bcrypt.hash("Correct123", 10);
    const prisma = createPrismaMock([
      { id: "u1", name: "Test", email: "test@example.com", password: passwordHash, role: Role.USER, status: UserStatus.ACTIVE }
    ]);
    const service = new AuthService(prisma as never, jwtService);

    await expect(service.login({ email: "test@example.com", password: "Wrong" })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects login for inactive user", async () => {
    const passwordHash = await bcrypt.hash("Correct123", 10);
    const prisma = createPrismaMock([
      { id: "u1", name: "Test", email: "inactive@example.com", password: passwordHash, role: Role.USER, status: UserStatus.INACTIVE }
    ]);
    const service = new AuthService(prisma as never, jwtService);

    await expect(service.login({ email: "inactive@example.com", password: "Correct123" })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects duplicate email register", async () => {
    const prisma = createPrismaMock([
      { id: "u1", name: "Existing", email: "dup@example.com", password: "hash", role: Role.USER, status: UserStatus.ACTIVE }
    ]);
    const service = new AuthService(prisma as never, jwtService);

    await expect(service.register({ name: "Dup", email: "dup@example.com", password: "Password123" })).rejects.toBeInstanceOf(ConflictException);
  });

  it("login returns token for valid credentials", async () => {
    const passwordHash = await bcrypt.hash("Correct123", 10);
    const prisma = createPrismaMock([
      { id: "u1", name: "Test", email: "ok@example.com", password: passwordHash, role: Role.MANAGER, status: UserStatus.ACTIVE }
    ]);
    const service = new AuthService(prisma as never, jwtService);

    const result = await service.login({ email: "ok@example.com", password: "Correct123" });
    expect(result.accessToken).toBeTruthy();
    expect(result.user.role).toBe(Role.MANAGER);
  });
});
