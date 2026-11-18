import { Router } from "express";
import * as controller from "../controllers/invites.controller";

const router = Router();

router.get("/:token", controller.getInvite);
router.post("/:token/accept", controller.accept);

export default router;