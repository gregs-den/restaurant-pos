import prisma from "./prisma"

// ===== Tables =====
export async function getTables() {
  return prisma.table.findMany({ orderBy: { tableNumber: "asc" } })
}

export async function updateTableStatus(id: string, status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "BILLING") {
  return prisma.table.update({ where: { id }, data: { status } })
}

export async function createTable(data: { tableNumber: string; capacity?: number; floorSection?: string }) {
  return prisma.table.create({ data })
}

// ===== Orders =====
export async function createOrder(data: {
  tableId?: string
  userId: string
  orderType?: "DINE_IN" | "TAKEOUT" | "DELIVERY"
  notes?: string
}) {
  const order = await prisma.order.create({ data })

  // Mark table as occupied if dine-in
  if (data.tableId) {
    await prisma.table.update({
      where: { id: data.tableId },
      data: { status: "OCCUPIED" },
    })
  }

  return order
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      table: true,
      user: { select: { id: true, name: true } },
      orderItems: {
        include: {
          menuItem: true,
          orderItemModifiers: true,
        },
      },
    },
  })
}

export async function updateOrderStatus(id: string, status: "PENDING" | "ACTIVE" | "SERVED" | "CANCELLED") {
  return prisma.order.update({ where: { id }, data: { status } })
}

// ===== Order Items =====
export async function addOrderItem(orderId: string, data: {
  menuItemId: string
  quantity: number
  notes?: string
  modifierIds?: string[]
}) {
  const menuItem = await prisma.menuItem.findUnique({ where: { id: data.menuItemId } })
  if (!menuItem) throw new Error("Menu item not found")

  let modifiersTotal = 0
  let modifiers: { id: string; name: string; additionalPrice: number }[] = []

  if (data.modifierIds && data.modifierIds.length > 0) {
    const foundModifiers = await prisma.modifier.findMany({
      where: { id: { in: data.modifierIds } },
    })
    modifiers = foundModifiers.map((m) => ({
      id: m.id,
      name: m.name,
      additionalPrice: Number(m.additionalPrice),
    }))
    modifiersTotal = modifiers.reduce((sum, m) => sum + m.additionalPrice, 0)
  }

  const unitPrice = Number(menuItem.price)
  const subtotal = (unitPrice + modifiersTotal) * data.quantity

  const orderItem = await prisma.orderItem.create({
    data: {
      orderId,
      menuItemId: data.menuItemId,
      quantity: data.quantity,
      unitPrice,
      subtotal,
      notes: data.notes,
    },
  })

  if (modifiers.length > 0) {
    await prisma.orderItemModifier.createMany({
      data: modifiers.map((m) => ({
        orderItemId: orderItem.id,
        modifierId: m.id,
        name: m.name,
        additionalPrice: m.additionalPrice,
      })),
    })
  }

  return prisma.orderItem.findUnique({
    where: { id: orderItem.id },
    include: { orderItemModifiers: true, menuItem: true },
  })
}

export async function updateOrderItem(id: string, data: { quantity?: number; notes?: string }) {
  return prisma.orderItem.update({ where: { id }, data })
}

export async function deleteOrderItem(id: string) {
  return prisma.orderItem.delete({ where: { id } })
}

export async function updateOrderItemStatus(id: string, status: "PENDING" | "COOKING" | "SERVED" | "CANCELLED") {
  return prisma.orderItem.update({ where: { id }, data: { status } })
}

export async function getActiveKitchenOrders() {
  return prisma.order.findMany({
    where: { status: { in: ["PENDING", "ACTIVE"] } },
    include: {
      table: true,
      orderItems: {
        where: { status: { in: ["PENDING", "COOKING"] } },
        include: { menuItem: true, orderItemModifiers: true },
      },
    },
    orderBy: { createdAt: "asc" },
  })
}

const VAT_RATE = 0.12

export async function calculateBill(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: true },
  })

  if (!order) throw new Error("Order not found")

  const subtotal = order.orderItems.reduce(
    (sum, item) => sum + Number(item.subtotal),
    0
  )

  const discountAmount = Number(order.discountAmount || 0)
  const taxableAmount = subtotal - discountAmount
  const taxAmount = taxableAmount * VAT_RATE
  const totalAmount = taxableAmount + taxAmount

  return prisma.order.update({
    where: { id: orderId },
    data: {
      subtotal,
      taxAmount,
      totalAmount,
    },
    include: { orderItems: { include: { menuItem: true } }, table: true },
  })
}

export async function applyDiscount(orderId: string, discountAmount: number) {
  await prisma.order.update({
    where: { id: orderId },
    data: { discountAmount },
  })
  return calculateBill(orderId)
}

export async function addPayment(orderId: string, data: {
  method: "CASH" | "CARD" | "GCASH" | "MAYA" | "OTHER_EWALLET"
  amount: number
  referenceNo?: string
  receivedBy: string
}) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true },
  })

  if (!order) throw new Error("Order not found")
  if (!order.totalAmount) throw new Error("Bill not calculated yet — call calculate-bill first")

  const payment = await prisma.payment.create({
    data: { orderId, ...data },
  })

  const totalPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0) + data.amount
  const totalDue = Number(order.totalAmount)

  let paymentStatus: "UNPAID" | "PARTIAL" | "PAID" = "PARTIAL"
  if (totalPaid >= totalDue) paymentStatus = "PAID"
  if (totalPaid <= 0) paymentStatus = "UNPAID"

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus,
      status: paymentStatus === "PAID" ? "SERVED" : order.status,
    },
  })

  // Free up the table if fully paid
  if (paymentStatus === "PAID" && order.tableId) {
    await prisma.table.update({
      where: { id: order.tableId },
      data: { status: "AVAILABLE" },
    })
  }

  return { payment, totalPaid, totalDue, change: Math.max(0, totalPaid - totalDue), paymentStatus }
}

export async function getReceipt(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      table: true,
      user: { select: { name: true } },
      orderItems: { include: { menuItem: true, orderItemModifiers: true } },
      payments: true,
    },
  })
}

export async function getOrderHistory(filters?: { from?: string; to?: string }) {
  const where: any = { paymentStatus: "PAID" }

  if (filters?.from || filters?.to) {
    where.updatedAt = {}
    if (filters.from) where.updatedAt.gte = new Date(filters.from)
    if (filters.to) where.updatedAt.lte = new Date(filters.to)
  }

  return prisma.order.findMany({
    where,
    include: {
      table: true,
      user: { select: { name: true } },
      orderItems: { include: { menuItem: true } },
      payments: true,
    },
    orderBy: { updatedAt: "desc" },
  })
}

export async function getDashboardStats() {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const [todayOrders, allTables, topItems, hourlyData] = await Promise.all([
    // Today's paid orders
    prisma.order.findMany({
      where: {
        paymentStatus: "PAID",
        updatedAt: { gte: todayStart, lte: todayEnd },
      },
      include: { payments: true },
    }),

    // All tables with status
    prisma.table.findMany(),

    // Top selling items (all time)
    prisma.orderItem.groupBy({
      by: ["menuItemId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),

    // Hourly sales today
    prisma.order.findMany({
      where: {
        paymentStatus: "PAID",
        updatedAt: { gte: todayStart, lte: todayEnd },
      },
      select: { totalAmount: true, updatedAt: true },
    }),
  ])

  // Resolve top item names
  const topItemIds = topItems.map(i => i.menuItemId)
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: topItemIds } },
    select: { id: true, name: true },
  })

  const topSelling = topItems.map(i => ({
    name: menuItems.find(m => m.id === i.menuItemId)?.name || "Unknown",
    quantity: i._sum.quantity || 0,
  }))

  // Hourly breakdown
  const hourly = Array.from({ length: 24 }, (_, h) => {
    const sales = hourlyData
      .filter(o => new Date(o.updatedAt).getHours() === h)
      .reduce((s, o) => s + Number(o.totalAmount || 0), 0)
    return { hour: h, sales }
  })

  const totalRevenue = todayOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0)
  const totalOrders = todayOrders.length
  const avgTicket = totalOrders ? totalRevenue / totalOrders : 0

  return {
    totalRevenue,
    totalOrders,
    avgTicket,
    tables: {
      total: allTables.length,
      occupied: allTables.filter(t => t.status === "OCCUPIED").length,
      available: allTables.filter(t => t.status === "AVAILABLE").length,
      reserved: allTables.filter(t => t.status === "RESERVED").length,
    },
    topSelling,
    hourly,
  }
}

export async function getSalesReport(from: string, to: string) {
  const fromDate = new Date(from)
  fromDate.setHours(0, 0, 0, 0)
  const toDate = new Date(to)
  toDate.setHours(23, 59, 59, 999)

  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: "PAID",
      updatedAt: { gte: fromDate, lte: toDate },
    },
    include: {
      table: true,
      user: { select: { name: true } },
      orderItems: { include: { menuItem: true } },
      payments: true,
    },
    orderBy: { updatedAt: "asc" },
  })

  // Summary
  const totalRevenue = orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0)
  const totalVAT = orders.reduce((s, o) => s + Number(o.taxAmount || 0), 0)
  const totalDiscount = orders.reduce((s, o) => s + Number(o.discountAmount || 0), 0)
  const totalOrders = orders.length

  // Payment method breakdown
  const paymentBreakdown: Record<string, number> = {}
  orders.forEach(o => {
    o.payments.forEach(p => {
      paymentBreakdown[p.method] = (paymentBreakdown[p.method] || 0) + Number(p.amount)
    })
  })

  // Per item breakdown
  const itemMap: Record<string, { name: string; quantity: number; revenue: number }> = {}
  orders.forEach(o => {
    o.orderItems.forEach(it => {
      const id = it.menuItemId
      if (!itemMap[id]) itemMap[id] = { name: it.menuItem.name, quantity: 0, revenue: 0 }
      itemMap[id].quantity += it.quantity
      itemMap[id].revenue += Number(it.subtotal)
    })
  })
  const itemBreakdown = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue)

  // Daily breakdown
  const dailyMap: Record<string, { orders: number; revenue: number }> = {}
  orders.forEach(o => {
    const day = new Date(o.updatedAt).toISOString().slice(0, 10)
    if (!dailyMap[day]) dailyMap[day] = { orders: 0, revenue: 0 }
    dailyMap[day].orders++
    dailyMap[day].revenue += Number(o.totalAmount || 0)
  })
  const dailyBreakdown = Object.entries(dailyMap).map(([date, data]) => ({ date, ...data }))

  return {
    summary: { totalRevenue, totalVAT, totalDiscount, totalOrders, fromDate: from, toDate: to },
    paymentBreakdown,
    itemBreakdown,
    dailyBreakdown,
    orders,
  }
}