import { Router } from "express"
import * as inventoryController from "../controllers/inventory.controller"
import { authenticate } from "../middleware/auth.middleware"
import { requireRole } from "../middleware/role.middleware"

const router = Router()

// Ingredients
router.get("/ingredients", authenticate, inventoryController.getIngredients)
router.post("/ingredients", authenticate, requireRole("ADMIN", "MANAGER"), inventoryController.createIngredient)
router.put("/ingredients/:id", authenticate, requireRole("ADMIN", "MANAGER"), inventoryController.updateIngredient)
router.delete("/ingredients/:id", authenticate, requireRole("ADMIN", "MANAGER"), inventoryController.deleteIngredient)

// Stock movements
router.post("/stock/adjust", authenticate, requireRole("ADMIN", "MANAGER"), inventoryController.adjustStock)
router.get("/stock/movements", authenticate, requireRole("ADMIN", "MANAGER"), inventoryController.getStockMovements)
router.get("/stock/low-stock", authenticate, inventoryController.getLowStockAlerts)

// Menu item ingredients (recipe)
router.get("/menu-items/:menuItemId/ingredients", authenticate, inventoryController.getMenuItemIngredients)
router.post("/menu-items/:menuItemId/ingredients", authenticate, requireRole("ADMIN", "MANAGER"), inventoryController.setMenuItemIngredients)
router.get("/menu-items/:menuItemId/set-components", authenticate, inventoryController.getSetMealComponents)
router.post("/menu-items/:menuItemId/set-components", authenticate, requireRole("ADMIN", "MANAGER"), inventoryController.setSetMealComponents)

// Auto-deduct for order
router.post("/orders/:id/deduct-stock", authenticate, inventoryController.deductStockForOrder)

export default router