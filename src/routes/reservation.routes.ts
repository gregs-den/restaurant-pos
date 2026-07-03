import { Router } from "express"
import * as reservationController from "../controllers/reservation.controller"
import { authenticate } from "../middleware/auth.middleware"
import { requireRole } from "../middleware/role.middleware"

const router = Router()

router.get("/reservations", authenticate, reservationController.getReservations)
router.get("/reservations/today", authenticate, reservationController.getTodayReservations)
router.post("/reservations", authenticate, reservationController.createReservation)
router.put("/reservations/:id", authenticate, reservationController.updateReservation)
router.patch("/reservations/:id/status", authenticate, reservationController.updateReservationStatus)
router.delete("/reservations/:id", authenticate, requireRole("ADMIN", "MANAGER"), reservationController.deleteReservation)

export default router