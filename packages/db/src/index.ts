import pkg from "@prisma/client";
export * from "@prisma/client";

const { PrismaClient } = pkg;
export const prisma = new PrismaClient();

