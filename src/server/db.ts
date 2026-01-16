export async function getPrisma() {
  const { prisma } = await import("@/db");
  return prisma;
}

export async function getPrismaErrors() {
  const { Prisma } = await import("@prisma/client");
  return Prisma;
}
