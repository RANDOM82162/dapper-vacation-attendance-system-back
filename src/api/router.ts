import express from "express";
import adminsRoutes from "./admins/admins.routes"
import metricsRoutes from "./metrics/metrics.routes"
import fcmRoutes from "./fcm_tokens/fcmTokens.routes"

const router = express.Router();

router.use('/admin', adminsRoutes)
router.use('/metrics', metricsRoutes)
router.use('/fcm', fcmRoutes)

router.get("/ping", (req, res) => {
  res.status(200).send("ok");
});


export { router };
