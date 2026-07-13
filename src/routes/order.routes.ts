import { Router } from "express"
import * as orderController from "../controllers/order.controller"
import { authenticate } from "../middleware/auth.middleware"
import { requireRole } from "../middleware/role.middleware"

const router = Router()

// Tables
router.get("/tables", authenticate, orderController.listTables)
router.post("/tables", authenticate, requireRole("ADMIN", "MANAGER","WAITER"), orderController.createTable)
router.put("/tables/:id", authenticate, requireRole("ADMIN", "MANAGER", "WAITER"), orderController.updateTable)
router.get("/tables/with-merge-info", authenticate, orderController.listTablesWithMergeInfo)
router.post("/tables/:id/merge", authenticate, requireRole("ADMIN", "MANAGER", "CASHIER", "WAITER"), orderController.mergeTable)
router.post("/tables/:id/unmerge", authenticate, requireRole("ADMIN", "MANAGER", "CASHIER", "WAITER"), orderController.unmergeTable)
router.patch("/tables/:id/status", authenticate, orderController.updateTableStatus)

// Kitchen (must come BEFORE /orders/:id so "kitchen" isn't matched as an :id)
router.get("/kitchen/orders", authenticate, orderController.getKitchenOrders)

router.get("/dashboard/stats", authenticate, requireRole("ADMIN", "MANAGER"), orderController.getDashboardStats)
router.get("/reports/sales", authenticate, requireRole("ADMIN", "MANAGER"), orderController.getSalesReport)

// Orders
router.get("/orders/history", authenticate, orderController.getOrderHistory)
router.post("/orders", authenticate, orderController.createOrder)
router.post("/order-items/:id/void", authenticate, orderController.voidOrderItem)
router.post("/orders/:id/void", authenticate, orderController.voidOrder)
router.get("/void-logs", authenticate, requireRole("ADMIN", "MANAGER"), orderController.getVoidLogs)
router.post("/orders/full", authenticate, orderController.createFullOrder)
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

router.get("/or-counter", authenticate, requireRole("ADMIN"), orderController.getOrCounterStatus)
router.post("/or-counter/reset", authenticate, requireRole("ADMIN"), orderController.resetOrCounter)

export default router 