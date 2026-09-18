import { NextFunction, Request, Response } from "express";
import { createShipmentSchema, listShipmentsQuerySchema, recordEventSchema } from "../dtos/shipment.dto";
import { createShipment, deleteShipment, getShipment, listShipments, recordEvent, updateShipment } from "../services/shipment.service";

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

export async function postShipment(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createShipmentSchema.parse(req.body);
    const shipment = await createShipment(body);
    res.status(201).json(shipment);
  } catch (err) {
    next(err);
  }
}

export async function putShipment(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createShipmentSchema.parse(req.body);
    const shipment = await updateShipment(req.params.id, body);
    res.json(shipment);
  } catch (err) {
    next(err);
  }
}

export async function deleteShipmentById(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteShipment(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function postShipmentEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const body = recordEventSchema.parse(req.body);
    const shipment = await recordEvent(req.params.id, body);
    res.json(shipment);
  } catch (err) {
    next(err);
  }
}
