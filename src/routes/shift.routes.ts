import { Router } from "express"
import * as shiftController from "../controllers/shift.controller"
import { authenticate } from "../middleware/auth.middleware"
import { requireRole } from "../middleware/role.middleware"

const router = Router()

router.get("/shifts/current", authenticate, requireRole("ADMIN", "MANAGER", "CASHIER"), shiftController.getCurrentShift)
router.post("/shifts/open", authenticate, requireRole("ADMIN", "MANAGER", "CASHIER"), shiftController.openShift)
router.post("/shifts/:id/close", authenticate, requireRole("ADMIN", "MANAGER", "CASHIER"), shiftController.closeShift)
router.get("/shifts/:id/summary", authenticate, requireRole("ADMIN", "MANAGER", "CASHIER"), shiftController.getShiftSummary)
router.get("/shifts/history", authenticate, requireRole("ADMIN", "MANAGER"), shiftController.getShiftHistory)

export default router