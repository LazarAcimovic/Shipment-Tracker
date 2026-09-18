import { Router } from "express";
import { deleteShipmentById, getShipmentById, getShipments, postShipment, postShipmentEvent, putShipment } from "../controllers/shipment.controller";

const router = Router();

router.get("/", getShipments);
router.post("/", postShipment);
router.get("/:id", getShipmentById);
router.put("/:id", putShipment);
router.delete("/:id", deleteShipmentById);
router.post("/:id/events", postShipmentEvent);

export default router;
