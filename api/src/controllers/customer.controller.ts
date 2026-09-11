import { Request, Response, NextFunction } from "express";
import { listCustomers } from "../services/customer.service";

export async function getCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const customers = await listCustomers();
    res.json(customers);
  } catch (err) {
    next(err);
  }
}
