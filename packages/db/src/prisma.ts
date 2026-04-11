import { Prisma, PrismaClient } from "@prisma/client";
import { logger } from "@kunda/config";

type PrismaLogEvent = "query" | "warn" | "error";
type AppPrismaClient = PrismaClient<Prisma.PrismaClientOptions, PrismaLogEvent>;

const globalForPrisma = globalThis as unknown as {
  prisma: AppPrismaClient | undefined;
};

const prismaClientOptions = {
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "error" },
    { emit: "event", level: "warn" },
  ],
} satisfies Prisma.PrismaClientOptions;

function createPrismaClient(): AppPrismaClient {
  return new PrismaClient<Prisma.PrismaClientOptions, PrismaLogEvent>(
    prismaClientOptions,
  );
}

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

prisma.$on("error", (event) => {
  logger.error("Prisma error", { message: event.message });
});
