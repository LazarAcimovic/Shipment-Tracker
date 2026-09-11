import { Router } from "express";
import { getShipmentById, getShipments, postShipment, postShipmentEvent } from "../controllers/shipment.controller";

const router = Router();

router.get("/", getShipments);
router.post("/", postShipment);
router.get("/:id", getShipmentById);
router.post("/:id/events", postShipmentEvent);

export default router;
