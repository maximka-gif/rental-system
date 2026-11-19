import { Router } from "express";
import * as controller from "../controllers/invoices.controller";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

router.use(authenticate, requireRole("OWNER"));

router.get("/", controller.list);
router.post("/generate", controller.generate);
router.post("/recalculate", controller.recalculate);
router.get("/:id", controller.getById);
router.post("/:id/items", controller.addItem);
router.post("/:id/payments", controller.recordPayment);
router.post("/:id/cancel", controller.cancel);

export default router;