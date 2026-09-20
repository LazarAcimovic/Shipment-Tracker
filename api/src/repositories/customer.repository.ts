import { prisma } from "../config/prisma";

export async function findAllCustomers(search?: string, limit = 20) {
  return prisma.customer.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
    take: limit,
  });
}

export async function findCustomerById(id: string) {
  return prisma.customer.findUnique({ where: { id } });
}
