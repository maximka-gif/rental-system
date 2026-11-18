import { Router } from "express";
import * as controller from "../controllers/tenants.controller";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

router.use(authenticate, requireRole("OWNER"));

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);
router.post("/:id/invite", controller.createInvite);

export default router;