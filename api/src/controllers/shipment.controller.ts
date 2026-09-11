import { NextFunction, Request, Response } from "express";
import { listShipmentsQuerySchema } from "../dtos/shipment.dto";
import { getShipment, listShipments } from "../services/shipment.service";

export async function getShipments(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listShipmentsQuerySchema.parse(req.query);
    const result = await listShipments(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getShipmentById(req: Request, res: Response, next: NextFunction) {
  try {
    const shipment = await getShipment(req.params.id);
    res.json(shipment);
  } catch (err) {
    next(err);
  }
}
