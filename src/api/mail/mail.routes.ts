import express from "express";
import * as controller from "./access.controller";
import { AuthMiddleware } from "../../middleware/auth.middleware";

const router = express.Router();

router.post("/contact",
    controller.requestAccessController);

router.post("/quotation", AuthMiddleware.verifyToken,
    controller.sendCotizacionController);


export default router;