// packages/db/src/index.ts
export * from "@prisma/client";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
