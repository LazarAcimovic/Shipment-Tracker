import { prisma } from "../config/prisma";

export async function findAllCustomers() {
  return prisma.customer.findMany({ orderBy: { name: "asc" } });
}

export async function findCustomerById(id: string) {
  return prisma.customer.findUnique({ where: { id } });
}
