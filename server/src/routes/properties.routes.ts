import { Router } from "express";
import * as controller from "../controllers/properties.controller";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// усі маршрути цього модуля доступні лише власнику
router.use(authenticate, requireRole("OWNER"));

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;