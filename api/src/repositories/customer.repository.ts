import { prisma } from "../config/prisma";

export async function findAllCustomers() {
  return prisma.customer.findMany({ orderBy: { name: "asc" } });
}
