import { Router } from "express";
import * as controller from "../controllers/payments.controller";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// вебхук викликає LiqPay, тому тут немає входу в систему
router.post("/liqpay/callback", controller.liqpayCallback);

router.use(authenticate);

router.post("/invoices/:invoiceId/checkout", requireRole("TENANT"), controller.checkout);
router.post("/mock/:orderId/complete", requireRole("TENANT"), controller.mockComplete);
router.post("/:orderId/sync", requireRole("TENANT", "OWNER"), controller.sync);

export default router;