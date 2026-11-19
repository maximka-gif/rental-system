import { Router } from "express";
import * as controller from "../controllers/leases.controller";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

router.use(authenticate, requireRole("OWNER"));

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);
router.post("/:id/activate", controller.activate);
router.post("/:id/terminate", controller.terminate);
router.post("/:id/renew", controller.renew);

export default router;