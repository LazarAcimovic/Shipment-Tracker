import { ShipmentStatus } from "@prisma/client";
import { z } from "zod";

const shipmentStatusValues = Object.values(ShipmentStatus) as [
  ShipmentStatus,
  ...ShipmentStatus[],
];

export const createShipmentSchema = z
  .object({
    customerId: z.string().uuid("Customer is required"),
    origin: z.string().min(1, "Origin is required"),
    destination: z.string().min(1, "Destination is required"),
    promisedDeliveryDate: z.string().datetime("Promised delivery date must be a valid date"),
  })
  .refine(
    (d) => d.origin.trim().toLowerCase() !== d.destination.trim().toLowerCase(),
    { message: "Origin and destination must be different", path: ["destination"] },
  );

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
