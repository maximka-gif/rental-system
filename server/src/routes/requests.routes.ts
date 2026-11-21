import { Router } from "express";
import * as controller from "../controllers/requests.controller";
import { authenticate, requireRole } from "../middleware/auth";
import { uploadImages } from "../middleware/upload";

const router = Router();

router.use(authenticate);

const both = requireRole("OWNER", "TENANT");

router.get("/", both, controller.list);
router.get("/:id", both, controller.getById);
router.post("/", requireRole("TENANT"), uploadImages.array("photos", 5), controller.create);
router.post("/:id/comments", both, controller.addComment);
router.patch("/:id/status", requireRole("OWNER"), controller.changeStatus);

export default router;