-- DropForeignKey
ALTER TABLE "ShipmentEvent" DROP CONSTRAINT "ShipmentEvent_shipmentId_fkey";

-- AddForeignKey
ALTER TABLE "ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
