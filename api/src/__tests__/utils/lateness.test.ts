import { describe, it, expect } from "vitest";
import { computeLateness } from "../../utils/lateness";
import { Shipment } from "@prisma/client";

function makeShipment(overrides: Partial<Shipment>): Shipment {
  return {
    id: "test-id",
    customerId: "customer-id",
    origin: "Warsaw",
    destination: "Berlin",
    currentStatus: "PICKED_UP",
    promisedDeliveryDate: new Date("2026-09-10T00:00:00.000Z"),
    deliveredAt: null,
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    updatedAt: new Date("2026-09-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("computeLateness", () => {
  describe("in-transit shipments", () => {
    it("is not late when now is before the deadline", () => {
      const shipment = makeShipment({
        promisedDeliveryDate: new Date("2026-09-15T00:00:00.000Z"),
      });
      const now = new Date("2026-09-12T00:00:00.000Z");

      const { isLate, lateByMs } = computeLateness(shipment, now);

      expect(isLate).toBe(false);
      expect(lateByMs).toBe(0);
    });

    it("is late when now is past the deadline", () => {
      const shipment = makeShipment({
        promisedDeliveryDate: new Date("2026-09-10T00:00:00.000Z"),
      });
      const now = new Date("2026-09-12T00:00:00.000Z");

      const { isLate, lateByMs } = computeLateness(shipment, now);

      expect(isLate).toBe(true);
      expect(lateByMs).toBe(2 * 24 * 60 * 60 * 1000);
    });
  });

  describe("delivered shipments", () => {
    it("is not late when delivered before the deadline", () => {
      const shipment = makeShipment({
        currentStatus: "DELIVERED",
        promisedDeliveryDate: new Date("2026-09-15T00:00:00.000Z"),
        deliveredAt: new Date("2026-09-13T00:00:00.000Z"),
      });
      const now = new Date("2026-09-20T00:00:00.000Z");

      const { isLate, lateByMs } = computeLateness(shipment, now);

      expect(isLate).toBe(false);
      expect(lateByMs).toBe(0);
    });

    it("is late when delivered after the deadline", () => {
      const shipment = makeShipment({
        currentStatus: "DELIVERED",
        promisedDeliveryDate: new Date("2026-09-10T00:00:00.000Z"),
        deliveredAt: new Date("2026-09-12T00:00:00.000Z"),
      });
      const now = new Date("2026-09-20T00:00:00.000Z");

      const { isLate, lateByMs } = computeLateness(shipment, now);

      expect(isLate).toBe(true);
      expect(lateByMs).toBe(2 * 24 * 60 * 60 * 1000);
    });

    it("lateByMs is frozen at deliveredAt, does not grow with now", () => {
      const shipment = makeShipment({
        currentStatus: "DELIVERED",
        promisedDeliveryDate: new Date("2026-09-10T00:00:00.000Z"),
        deliveredAt: new Date("2026-09-12T00:00:00.000Z"),
      });

      const { lateByMs: lateBy1 } = computeLateness(
        shipment,
        new Date("2026-09-15T00:00:00.000Z"),
      );
      const { lateByMs: lateBy2 } = computeLateness(
        shipment,
        new Date("2026-09-20T00:00:00.000Z"),
      );

      expect(lateBy1).toBe(lateBy2);
      expect(lateBy1).toBe(2 * 24 * 60 * 60 * 1000);
    });
  });
});
