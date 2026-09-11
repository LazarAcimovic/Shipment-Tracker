import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { toHumanMessage } from "../utils/zodHelpers";
import { HttpError } from "./httpError";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  if (err instanceof ZodError) {
    const messages = err.errors.map(toHumanMessage);
    res.status(422).json({ error: messages });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
