import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

type PrismaClientLike = Record<string, unknown> & {
  $connect?: () => Promise<void>;
  $disconnect?: () => Promise<void>;
};

type PrismaClientConstructor = new (...args: unknown[]) => PrismaClientLike;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientLike;
};

function resolvePrismaClientConstructor(): PrismaClientConstructor | null {
  try {
    const require = createRequire(import.meta.url);
    const prismaPackage = require("@prisma/client") as { PrismaClient?: PrismaClientConstructor };
    return prismaPackage.PrismaClient ?? null;
  } catch {
    return null;
  }
}

function localPrismaEngineMissing() {
  if (process.env.NODE_ENV === "production" || process.platform !== "linux") return false;
  if (process.env.PRISMA_QUERY_ENGINE_BINARY || process.env.PRISMA_QUERY_ENGINE_LIBRARY) return false;
  const candidates = [
    join(process.cwd(), "node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node"),
    join(process.cwd(), "node_modules/.prisma/client/query-engine-debian-openssl-3.0.x")
  ];
  return !candidates.some((candidate) => existsSync(candidate));
}

function createUnavailablePrismaStub(): PrismaClientLike {
  const unavailable = async () => {
    throw new Error("Prisma Client or query engine for this platform is not generated. Run `npx prisma generate` after installing dependencies.");
  };
  const modelProxy = new Proxy({}, {
    get(_target, property) {
      if (property === "then") return undefined;
      return unavailable;
    }
  });
  return new Proxy({}, {
    get(_target, property) {
      if (property === "then") return undefined;
      if (property === "$connect" || property === "$disconnect") return async () => undefined;
      return modelProxy;
    }
  }) as PrismaClientLike;
}

function createPrismaClient(): PrismaClientLike {
  if (process.env.NEXT_PHASE === "phase-production-build" || process.env.NEXT_SKIP_PRISMA_DURING_BUILD === "true") {
    return createUnavailablePrismaStub();
  }
  if (localPrismaEngineMissing()) return createUnavailablePrismaStub();
  const PrismaClient = resolvePrismaClientConstructor();
  return PrismaClient ? new PrismaClient() : createUnavailablePrismaStub();
}

export const prisma = (globalForPrisma.prisma ?? createPrismaClient()) as any;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
