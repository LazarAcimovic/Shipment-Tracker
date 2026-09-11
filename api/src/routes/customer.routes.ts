import { Router } from "express";
import { getCustomers } from "../controllers/customer.controller";

const router = Router();

router.get("/", getCustomers);

export default router;
