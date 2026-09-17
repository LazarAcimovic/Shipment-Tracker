import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
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
    res.status(422).json({ error: err.issues.map((i) => i.message) });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
