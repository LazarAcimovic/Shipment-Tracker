import { Customer, Shipment, ShipmentEvent, ShipmentStatus } from "@prisma/client";

export type ShipmentResponse = Shipment & {
  isLate: boolean;
  lateByMs: number;
};

export type ShipmentDetailResponse = ShipmentResponse & {
  customer: Customer;
  events: ShipmentEvent[];
  allowedNextStatuses: ShipmentStatus[];
};
