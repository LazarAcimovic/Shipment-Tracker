import { ShipmentStatus } from "@prisma/client";

export const ALLOWED_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  CONFIRMED: ["PREPARED"],
  PREPARED: ["PICKED_UP"],
  PICKED_UP: ["DEPARTED"],
  DEPARTED: ["AT_HUB"],
  AT_HUB: ["DEPARTED", "OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
};

export function canTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
