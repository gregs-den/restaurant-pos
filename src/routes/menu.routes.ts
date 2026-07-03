import { Router } from "express"
import * as menuController from "../controllers/menu.controller"
import { authenticate } from "../middleware/auth.middleware"
import { requireRole } from "../middleware/role.middleware"

const router = Router()

// Categories
router.get("/categories", menuController.listCategories)
router.post("/categories", authenticate, requireRole("ADMIN", "MANAGER"), menuController.createCategory)
router.put("/categories/:id", authenticate, requireRole("ADMIN", "MANAGER"), menuController.updateCategory)
router.delete("/categories/:id", authenticate, requireRole("ADMIN", "MANAGER"), menuController.deleteCategory)

// Menu Items
router.get("/menu-items", menuController.listMenuItems)
router.get("/menu-items/:id", menuController.getMenuItem)
router.post("/menu-items", authenticate, requireRole("ADMIN", "MANAGER"), menuController.createMenuItem)
router.put("/menu-items/:id", authenticate, requireRole("ADMIN", "MANAGER"), menuController.updateMenuItem)
router.patch("/menu-items/:id/toggle", authenticate, requireRole("ADMIN", "MANAGER"), menuController.toggleAvailability)
router.delete("/menu-items/:id", authenticate, requireRole("ADMIN", "MANAGER"), menuController.deleteMenuItem)

// Modifiers
router.post("/modifier-groups", authenticate, requireRole("ADMIN", "MANAGER"), menuController.createModifierGroup)
router.post("/modifier-groups/:groupId/modifiers", authenticate, requireRole("ADMIN", "MANAGER"), menuController.addModifier)
router.delete("/modifiers/:id", authenticate, requireRole("ADMIN", "MANAGER"), menuController.deleteModifier)

export default router