import { Request, Response, NextFunction } from "express";
import { listCustomers } from "../services/customer.service";
import { listCustomersSchema } from "../dtos/customer.dto";

export async function getCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listCustomersSchema.parse(req.query);
    const customers = await listCustomers(query);
    res.json(customers);
  } catch (err) {
    next(err);
  }
}
