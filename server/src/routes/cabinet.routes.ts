import { Router } from "express";
import * as controller from "../controllers/cabinet.controller";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

router.use(authenticate, requireRole("TENANT"));

router.get("/summary", controller.summary);
router.get("/invoices", controller.listInvoices);
router.get("/invoices/:id", controller.getInvoice);

export default router;