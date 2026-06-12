import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  // Prevent multiple instances of Prisma Client in development due to hot reloading
  const globalWithPrisma = global as typeof globalThis & {
    prismaPool?: Pool;
    prisma?: PrismaClient;
  };

  if (!globalWithPrisma.prismaPool) {
    globalWithPrisma.prismaPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  if (!globalWithPrisma.prisma) {
    const adapter = new PrismaPg(globalWithPrisma.prismaPool);
    globalWithPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalWithPrisma.prisma;
}

export { prisma };
export type { User, DriverProfile, DriverDocument } from "@prisma/client";
