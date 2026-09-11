import { Shipment } from "@prisma/client";

export function computeLateness(s: Shipment, now = new Date()) {
  const reference = s.deliveredAt ?? now;
  const isLate =
    s.currentStatus !== "DELIVERED"
      ? now > s.promisedDeliveryDate
      : reference > s.promisedDeliveryDate;
  const lateByMs = isLate
    ? reference.getTime() - s.promisedDeliveryDate.getTime()
    : 0;
  return { isLate, lateByMs };
}
