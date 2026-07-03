import { Router } from "express"
import * as orderController from "../controllers/order.controller"
import { authenticate } from "../middleware/auth.middleware"
import { requireRole } from "../middleware/role.middleware"

const router = Router()

// Tables
router.get("/tables", authenticate, orderController.listTables)
router.post("/tables", authenticate, requireRole("ADMIN", "MANAGER"), orderController.createTable)
router.patch("/tables/:id/status", authenticate, orderController.updateTableStatus)

// Kitchen (must come BEFORE /orders/:id so "kitchen" isn't matched as an :id)
router.get("/kitchen/orders", authenticate, orderController.getKitchenOrders)

router.get("/dashboard/stats", authenticate, requireRole("ADMIN", "MANAGER"), orderController.getDashboardStats)
router.get("/reports/sales", authenticate, requireRole("ADMIN", "MANAGER"), orderController.getSalesReport)

// Orders
router.get("/orders/history", authenticate, orderController.getOrderHistory)
router.post("/orders", authenticate, orderController.createOrder)
router.get("/orders/:id", authenticate, orderController.getOrder)
router.patch("/orders/:id/status", authenticate, orderController.updateOrderStatus)

// Order Items
router.post("/orders/:id/items", authenticate, orderController.addOrderItem)
router.patch("/order-items/:id", authenticate, orderController.updateOrderItem)
router.delete("/order-items/:id", authenticate, orderController.deleteOrderItem)
router.patch("/order-items/:id/status", authenticate, orderController.updateOrderItemStatus)

// Billing
router.post("/orders/:id/calculate-bill", authenticate, orderController.calculateBill)
router.post("/orders/:id/discount", authenticate, requireRole("ADMIN", "MANAGER", "CASHIER"), orderController.applyDiscount)
router.post("/orders/:id/payments", authenticate, requireRole("ADMIN", "MANAGER", "CASHIER"), orderController.addPayment)
router.get("/orders/:id/receipt", authenticate, orderController.getReceipt)

export default router 