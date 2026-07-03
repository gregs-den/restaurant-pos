import { Router } from "express"
import * as promoController from "../controllers/promo.controller"
import { authenticate } from "../middleware/auth.middleware"
import { requireRole } from "../middleware/role.middleware"

const router = Router()

// Promo management (admin/manager only)
router.get("/promos", authenticate, requireRole("ADMIN", "MANAGER"), promoController.getPromos)
router.post("/promos", authenticate, requireRole("ADMIN", "MANAGER"), promoController.createPromo)
router.put("/promos/:id", authenticate, requireRole("ADMIN", "MANAGER"), promoController.updatePromo)
router.delete("/promos/:id", authenticate, requireRole("ADMIN", "MANAGER"), promoController.deletePromo)

// Apply promo to order (cashier can do this)
router.post("/orders/:id/apply-promo", authenticate, requireRole("ADMIN", "MANAGER", "CASHIER"), promoController.applyPromo)
router.post("/orders/:id/special-discount", authenticate, requireRole("ADMIN", "MANAGER", "CASHIER"), promoController.applySpecialDiscount)

export default router