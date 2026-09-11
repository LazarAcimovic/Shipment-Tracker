import { Customer, Shipment, ShipmentEvent, ShipmentStatus } from "@prisma/client";
import { ShipmentDetailResponse, ShipmentResponse } from "../models/shipment.model";
import { computeLateness } from "./lateness";

export function toShipmentResponse(shipment: Shipment): ShipmentResponse {
  const { isLate, lateByMs } = computeLateness(shipment);
  return { ...shipment, isLate, lateByMs };
}

export function toShipmentDetailResponse(
  shipment: Shipment & { customer: Customer; events: ShipmentEvent[] },
  allowedNextStatuses: ShipmentStatus[],
): ShipmentDetailResponse {
  const { isLate, lateByMs } = computeLateness(shipment);
  return { ...shipment, isLate, lateByMs, allowedNextStatuses };
}
