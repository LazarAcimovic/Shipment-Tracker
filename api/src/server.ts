import "dotenv/config";
import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import customerRoutes from "./routes/customer.routes";
import shipmentRoutes from "./routes/shipment.routes";

const app = express();

app.use(cors({ origin: process.env.WEB_ORIGIN }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/customers", customerRoutes);
app.use("/api/shipments", shipmentRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
