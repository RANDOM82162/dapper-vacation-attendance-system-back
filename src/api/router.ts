import express from "express";
import adminsRoutes from "./admins/admins.routes"
import metricsRoutes from "./metrics/metrics.routes"
import fcmRoutes from "./fcm_tokens/fcmTokens.routes"
import employeesRoutes from "./employees/employees.routes"
import vacationRequestsRoutes from "./vacation_requests/vacationRequests.routes"
import vacationBalancesRoutes from "./vacation_balances/vacationBalances.routes"
import attendanceRecordsRoutes from "./attendance_records/attendanceRecords.routes"
import notificacionesRoutes from "./notificaciones/notificaciones.routes"

const router = express.Router();

router.use('/admin', adminsRoutes)
router.use('/metrics', metricsRoutes)
router.use('/fcm', fcmRoutes)
router.use('/employees', employeesRoutes)
router.use('/vacation-requests', vacationRequestsRoutes)
router.use('/vacation-balances', vacationBalancesRoutes)
router.use('/attendance-records', attendanceRecordsRoutes)
router.use('/notificaciones', notificacionesRoutes)

router.get("/ping", (req, res) => {
  res.status(200).send("ok");
});


export { router };
