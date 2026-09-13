import { Prisma, ShipmentStatus } from "@prisma/client";
import { prisma } from "../config/prisma";

type FindManyFilters = {
  status?: ShipmentStatus; 
  customerId?: string; 
  lateOnly?: boolean;
  search?: string;
};

export async function findManyShipments(
  filters: FindManyFilters,
  skip: number,
  take: number,
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

  const orderBy: Prisma.ShipmentOrderByWithRelationInput = { promisedDeliveryDate: "asc" };

  const [data, total] = await prisma.$transaction([
    prisma.shipment.findMany({ where, skip, take, orderBy, include: { customer: true } }),
    prisma.shipment.count({ where }),
  ]);

  return { data, total };
}

export async function createShipment(
  data: { customerId: string; origin: string; destination: string; promisedDeliveryDate: Date },
) {
  return prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.create({ data });
    await tx.shipmentEvent.create({
      data: {
        shipmentId: shipment.id,
        status: "CONFIRMED",
        location: data.origin,
        note: "Shipment created",
      },
    });
    return shipment;
  });
}

export async function recordShipmentEvent(
  shipmentId: string,
  toStatus: ShipmentStatus,
  location?: string,
  note?: string,
) {
  return prisma.$transaction(async (tx) => {
    await tx.shipmentEvent.create({
      data: { shipmentId, status: toStatus, location, note },
    });
    return tx.shipment.update({
      where: { id: shipmentId },
      data: {
        currentStatus: toStatus,
        deliveredAt: toStatus === "DELIVERED" ? new Date() : undefined,
      },  
    });
  });
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
