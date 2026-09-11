import { Router } from "express";
import { getShipmentById, getShipments } from "../controllers/shipment.controller";

const router = Router();

router.get("/", getShipments);
router.get("/:id", getShipmentById);

export default router;
