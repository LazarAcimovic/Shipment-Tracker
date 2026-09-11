import { ShipmentStatus } from "@prisma/client";
import { z } from "zod";

const shipmentStatusValues = Object.values(ShipmentStatus) as [
  ShipmentStatus,
  ...ShipmentStatus[],
];

export const createShipmentSchema = z.object({
  customerId: z.string().uuid(),
  origin: z.string().min(1),
  destination: z.string().min(1),
  promisedDeliveryDate: z.string().datetime(),
});

export const recordEventSchema = z.object({
  status: z.enum(shipmentStatusValues),
  location: z.string().min(1).optional(),
  note: z.string().min(1).optional(),
});

export const listShipmentsQuerySchema = z.object({
  status: z.enum(shipmentStatusValues).optional(),
  customerId: z.string().uuid().optional(),
  late: z.enum(["true", "false"]).optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
});

export type CreateShipmentDto = z.infer<typeof createShipmentSchema>;
export type RecordEventDto = z.infer<typeof recordEventSchema>;
export type ListShipmentsQuery = z.infer<typeof listShipmentsQuerySchema>;
