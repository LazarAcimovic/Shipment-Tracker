import { Prisma, ShipmentStatus } from "@prisma/client";
import { prisma } from "../config/prisma";

type FindManyFilters = {
  status?: ShipmentStatus; //at hub
  customerId?: string; //neki-id
  lateOnly?: boolean;//true
  search?: string;
};

export async function findManyShipments(
  filters: FindManyFilters,
  skip: number, //0
  take: number, //10
  sortByLate: boolean, //true
) {
  const now = new Date();

  const where: Prisma.ShipmentWhereInput = {};

  if (filters.status) {
    where.currentStatus = filters.status;
  }

  if (filters.customerId) {
    where.customerId = filters.customerId;
  }

  if (filters.search) {
    where.OR = [
      { origin: { contains: filters.search, mode: "insensitive" } },
      { destination: { contains: filters.search, mode: "insensitive" } },
      { customer: { name: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  if (filters.lateOnly) {
    where.AND = [
      {
        OR: [
          {
            currentStatus: { not: "DELIVERED" },
            promisedDeliveryDate: { lt: now },
          },
          {
            currentStatus: "DELIVERED",
            deliveredAt: { not: null },
          },
        ],
      },
    ];
  }

  const orderBy: Prisma.ShipmentOrderByWithRelationInput = sortByLate
    ? { promisedDeliveryDate: "asc" }
    : { createdAt: "desc" };

  const [data, total] = await prisma.$transaction([
    prisma.shipment.findMany({ where, skip, take, orderBy, include: { customer: true } }),
    prisma.shipment.count({ where }),
  ]);

  return { data, total };
}

export async function findShipmentById(id: string) {
  return prisma.shipment.findUnique({
    where: { id },
    include: {
      customer: true,
      events: { orderBy: { occurredAt: "asc" } },
    },
  });
}
