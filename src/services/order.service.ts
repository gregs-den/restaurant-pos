import prisma from "./prisma"

// ===== Tables =====
export async function getTables() {
  const tables = await prisma.table.findMany({ orderBy: { tableNumber: "asc" } })
  return attachReservationInfo(tables)
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
  let effectiveTableId = data.tableId

  // If this table is merged into another, route the order to the primary table
  if (data.tableId) {
    const table = await prisma.table.findUnique({ where: { id: data.tableId } })
    if (table?.mergedWithTableId) {
      effectiveTableId = table.mergedWithTableId
    }
  }

  const order = await prisma.order.create({
    data: { ...data, tableId: effectiveTableId },
  })

  if (effectiveTableId) {
    await prisma.table.update({
      where: { id: effectiveTableId },
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

  const subtotal = order.orderItems
    .filter(item => item.status !== "CANCELLED")
    .reduce((sum, item) => sum + Number(item.subtotal), 0)

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

  // Assign the next sequential OR number, only once, when the order first becomes fully paid
  let orNumber = order.orNumber
  if (paymentStatus === "PAID" && !orNumber) {
    orNumber = await getNextOrNumber()
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus,
      status: paymentStatus === "PAID" ? "SERVED" : order.status,
      orNumber: orNumber || undefined,
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

export async function mergeTable(tableId: string, mergeIntoTableId: string) {
  if (tableId === mergeIntoTableId) throw new Error("Cannot merge a table with itself.")

  const target = await prisma.table.findUnique({ where: { id: mergeIntoTableId } })
  if (!target) throw new Error("Target table not found.")
  if (target.mergedWithTableId) throw new Error("Target table is itself merged into another table. Merge into the primary table instead.")

  // Cascade fix: if the table being merged already has OTHER tables merged into it,
  // reassign those children directly to the new primary too — prevents orphaned chains.
  await prisma.table.updateMany({
    where: { mergedWithTableId: tableId },
    data: { mergedWithTableId: mergeIntoTableId },
  })

  return prisma.table.update({
    where: { id: tableId },
    data: {
      mergedWithTableId: mergeIntoTableId,
      status: "OCCUPIED",
    },
  })
}

export async function unmergeTable(tableId: string) {
  return prisma.table.update({
    where: { id: tableId },
    data: { mergedWithTableId: null, status: "AVAILABLE" },
  })
}

export async function getTablesWithMergeInfo() {
  const tables = await prisma.table.findMany({
    include: { mergedTables: true, mergedWithTable: true },
    orderBy: { tableNumber: "asc" },
  })
  return attachReservationInfo(tables)
}

export async function verifyManagerPin(pin: string) {
  const user = await prisma.user.findFirst({
    where: { pin, isActive: true, role: { in: ["ADMIN", "MANAGER"] } },
  })
  if (!user) throw new Error("Invalid PIN or insufficient permissions.")
  return user
}

export async function voidOrderItem(orderItemId: string, data: {
  reason: string
  approverPin: string
  voidedByUserId: string
}) {
  const approver = await verifyManagerPin(data.approverPin)

  const orderItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { menuItem: true, order: true },
  })
  if (!orderItem) throw new Error("Order item not found.")
  if (orderItem.status === "CANCELLED") throw new Error("Item is already voided.")

  await prisma.orderItem.update({
    where: { id: orderItemId },
    data: { status: "CANCELLED" },
  })

  await prisma.voidLog.create({
    data: {
      type: "ITEM",
      orderId: orderItem.orderId,
      orderItemId: orderItem.id,
      itemName: orderItem.menuItem.name,
      quantity: orderItem.quantity,
      amount: Number(orderItem.subtotal),
      reason: data.reason,
      voidedBy: data.voidedByUserId,
      approvedBy: approver.id,
    },
  })

  // Recalculate the bill since an item was removed
  await calculateBill(orderItem.orderId)

  return { message: "Item voided successfully." }
}

export async function voidOrder(orderId: string, data: {
  reason: string
  approverPin: string
  voidedByUserId: string
}) {
  const approver = await verifyManagerPin(data.approverPin)

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: { include: { menuItem: true } }, table: true },
  })
  if (!order) throw new Error("Order not found.")
  if (order.status === "CANCELLED") throw new Error("Order is already voided.")

  const totalAmount = order.orderItems.reduce((s, i) => s + Number(i.subtotal), 0)

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  })

  await prisma.orderItem.updateMany({
    where: { orderId },
    data: { status: "CANCELLED" },
  })

  await prisma.voidLog.create({
    data: {
      type: "ORDER",
      orderId: order.id,
      itemName: `Full Order (${order.orderItems.length} items)`,
      quantity: order.orderItems.length,
      amount: totalAmount,
      reason: data.reason,
      voidedBy: data.voidedByUserId,
      approvedBy: approver.id,
    },
  })

  // Free up the table if it was occupied
  if (order.tableId) {
    await prisma.table.update({
      where: { id: order.tableId },
      data: { status: "AVAILABLE" },
    })
  }

  return { message: "Order voided successfully." }
}

export async function getVoidLogs(filters?: { from?: string; to?: string }) {
  const where: any = {}
  if (filters?.from || filters?.to) {
    where.createdAt = {}
    if (filters.from) where.createdAt.gte = new Date(filters.from)
    if (filters.to) where.createdAt.lte = new Date(filters.to)
  }

  const logs = await prisma.voidLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })

  // Attach user names
  const userIds = [...new Set([...logs.map(l => l.voidedBy), ...logs.map(l => l.approvedBy)])]
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]))

  return logs.map(l => ({
    ...l,
    voidedByName: userMap[l.voidedBy] || "Unknown",
    approvedByName: userMap[l.approvedBy] || "Unknown",
  }))
}

export async function updateTable(id: string, data: { tableNumber?: string; capacity?: number; floorSection?: string }) {
  return prisma.table.update({ where: { id }, data })
}

export async function getNextOrNumber(): Promise<number> {
  // Atomic increment using a raw upsert-style transaction to avoid race conditions
  const result = await prisma.$transaction(async (tx) => {
    const counter = await tx.orNumberCounter.upsert({
      where: { id: 1 },
      update: { lastNumber: { increment: 1 } },
      create: { id: 1, lastNumber: 1 },
    })
    return counter.lastNumber
  })
  return result
}

export async function resetOrCounter() {
  return prisma.orNumberCounter.upsert({
    where: { id: 1 },
    update: { lastNumber: 0 },
    create: { id: 1, lastNumber: 0 },
  })
}

export async function getOrCounterStatus() {
  const counter = await prisma.orNumberCounter.findUnique({ where: { id: 1 } })
  return { lastNumber: counter?.lastNumber || 0 }
}

async function attachReservationInfo(tables: any[]) {
  const now = new Date()
  const windowStart = new Date(now.getTime() - 60 * 60 * 1000)  // up to 60 min ago
  const windowEnd = new Date(now.getTime() + 10 * 60 * 1000)    // up to 10 min from now

  const activeReservations = await prisma.reservation.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      reservedAt: { gte: windowStart, lte: windowEnd },
      tableId: { not: null },
    },
    orderBy: { reservedAt: "asc" },
  })

  const reservationByTable: Record<string, any> = {}
  activeReservations.forEach(r => {
    if (r.tableId && !reservationByTable[r.tableId]) {
      reservationByTable[r.tableId] = r
    }
  })

  return tables.map(t => {
    const reservation = reservationByTable[t.id]
    const isFreeToShowReserved = t.status === "AVAILABLE" // don't override Occupied/Billing
    const effectiveStatus = (reservation && isFreeToShowReserved) ? "RESERVED" : t.status

    return {
      ...t,
      effectiveStatus,
      activeReservation: (reservation && isFreeToShowReserved) ? {
        id: reservation.id,
        guestName: reservation.guestName,
        guestPhone: reservation.guestPhone,
        partySize: reservation.partySize,
        reservedAt: reservation.reservedAt,
        notes: reservation.notes,
      } : null,
    }
  })
}