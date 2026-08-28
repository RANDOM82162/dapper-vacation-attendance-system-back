import express from "express";
import * as controller from "./fcmTokensController";
import { AuthMiddleware } from "../../middleware/auth.middleware";

const router = express.Router();

router.post("/save",
    AuthMiddleware.verifyToken,
    controller.saveTokenController
);

export default router;