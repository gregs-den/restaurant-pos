import { Response } from "express"
import * as orderService from "../services/order.service"
import { AuthRequest } from "../middleware/auth.middleware"

// Tables
export async function listTables(req: AuthRequest, res: Response) {
  const tables = await orderService.getTables()
  res.json(tables)
}

export async function createTable(req: AuthRequest, res: Response) {
  try {
    const table = await orderService.createTable(req.body)
    res.status(201).json(table)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function updateTableStatus(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string
    const table = await orderService.updateTableStatus(id, req.body.status)
    res.json(table)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

// Orders
export async function createOrder(req: AuthRequest, res: Response) {
  try {
    const order = await orderService.createOrder({
      ...req.body,
      userId: req.user!.userId,
    })

    // Notify kitchen
    const io = req.app.get("io")
    io.to("kitchen").emit("new-order", order)

    res.status(201).json(order)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function getOrder(req: AuthRequest, res: Response) {
  const id = req.params.id as string
  const order = await orderService.getOrderById(id)
  if (!order) return res.status(404).json({ error: "Order not found" })
  res.json(order)
}

export async function updateOrderStatus(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string
    const order = await orderService.updateOrderStatus(id, req.body.status)
    res.json(order)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

// Order Items
export async function addOrderItem(req: AuthRequest, res: Response) {
  try {
    const orderId = req.params.id as string
    const { addOrderItemWithComponents, deductStockForOrderItemComponents } = await import("../services/order-item-component.service")

    const item = await addOrderItemWithComponents(orderId, req.body)

    const io = req.app.get("io")
    io.to("kitchen").emit("new-order-item", item)

    try {
      await deductStockForOrderItemComponents(item!.id, req.user!.userId)
    } catch (stockErr) {
      console.warn("Stock deduction skipped:", stockErr)
    }

    res.status(201).json(item)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function updateOrderItem(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string
    const item = await orderService.updateOrderItem(id, req.body)

    // Notify kitchen of status change
    const io = req.app.get("io")
    io.to("kitchen").emit("order-item-updated", item)

    res.json(item)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function deleteOrderItem(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string
    await orderService.deleteOrderItem(id)
    res.json({ message: "Order item removed" })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function updateOrderItemStatus(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string
    const item = await orderService.updateOrderItemStatus(id, req.body.status)

    const io = req.app.get("io")
    io.to("kitchen").emit("order-item-status-changed", item)

    res.json(item)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function getKitchenOrders(req: AuthRequest, res: Response) {
  const orders = await orderService.getActiveKitchenOrders()
  res.json(orders)
}

export async function calculateBill(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string
    const order = await orderService.calculateBill(id)
    res.json(order)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function applyDiscount(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string
    const order = await orderService.applyDiscount(id, req.body.discountAmount)
    res.json(order)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function addPayment(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string
    const result = await orderService.addPayment(id, {
      ...req.body,
      receivedBy: req.user!.userId,
    })
    res.status(201).json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function getReceipt(req: AuthRequest, res: Response) {
  const id = req.params.id as string
  const receipt = await orderService.getReceipt(id)
  if (!receipt) return res.status(404).json({ error: "Order not found" })
  res.json(receipt)
}

export async function getOrderHistory(req: AuthRequest, res: Response) {
  const { from, to } = req.query
  const orders = await orderService.getOrderHistory({
    from: from as string | undefined,
    to: to as string | undefined,
  })
  res.json(orders)
}

export async function getDashboardStats(req: AuthRequest, res: Response) {
  try {
    const stats = await orderService.getDashboardStats()
    res.json(stats)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function getSalesReport(req: AuthRequest, res: Response) {
  try {
    const { from, to } = req.query
    if (!from || !to) return res.status(400).json({ error: "from and to dates are required" })
    const report = await orderService.getSalesReport(from as string, to as string)
    res.json(report)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function mergeTable(req: AuthRequest, res: Response) {
  try {
    const tableId = req.params.id as string
    const { mergeIntoTableId } = req.body
    const table = await orderService.mergeTable(tableId, mergeIntoTableId)
    res.json(table)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function unmergeTable(req: AuthRequest, res: Response) {
  try {
    const tableId = req.params.id as string
    const table = await orderService.unmergeTable(tableId)
    res.json(table)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function listTablesWithMergeInfo(req: AuthRequest, res: Response) {
  const tables = await orderService.getTablesWithMergeInfo()
  res.json(tables)
}

export async function voidOrderItem(req: AuthRequest, res: Response) {
  try {
    const orderItemId = req.params.id as string
    const { reason, approverPin } = req.body
    if (!reason) return res.status(400).json({ error: "A reason is required." })
    if (!approverPin) return res.status(400).json({ error: "Manager/Admin PIN required." })
    const result = await orderService.voidOrderItem(orderItemId, {
      reason, approverPin, voidedByUserId: req.user!.userId,
    })
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function voidOrder(req: AuthRequest, res: Response) {
  try {
    const orderId = req.params.id as string
    const { reason, approverPin } = req.body
    if (!reason) return res.status(400).json({ error: "A reason is required." })
    if (!approverPin) return res.status(400).json({ error: "Manager/Admin PIN required." })
    const result = await orderService.voidOrder(orderId, {
      reason, approverPin, voidedByUserId: req.user!.userId,
    })
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function getVoidLogs(req: AuthRequest, res: Response) {
  const { from, to } = req.query
  const logs = await orderService.getVoidLogs({ from: from as string, to: to as string })
  res.json(logs)
}

export async function updateTable(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string
    const table = await orderService.updateTable(id, req.body)
    res.json(table)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}