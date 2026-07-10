import prisma from "./prisma"

export async function getCurrentShift() {
  return prisma.shift.findFirst({
    where: { status: "OPEN" },
    orderBy: { openedAt: "desc" },
  })
}

export async function openShift(data: { startingCash: number; openedBy: string; notes?: string }) {
  const existing = await getCurrentShift()
  if (existing) throw new Error("A shift is already open. Please close it before opening a new one.")

  return prisma.shift.create({
    data: {
      startingCash: data.startingCash,
      openedBy: data.openedBy,
      notes: data.notes,
    },
  })
}

export async function closeShift(shiftId: string, data: { endingCashCounted: number; closedBy: string; notes?: string }) {
  const shift = await prisma.shift.findUnique({ where: { id: shiftId } })
  if (!shift) throw new Error("Shift not found.")
  if (shift.status === "CLOSED") throw new Error("This shift is already closed.")

  // Calculate expected cash: starting cash + all CASH payments made during this shift
  const cashPayments = await prisma.payment.findMany({
    where: {
      method: "CASH",
      createdAt: { gte: shift.openedAt },
    },
  })
  const totalCashIn = cashPayments.reduce((s, p) => s + Number(p.amount), 0)
  const expectedCash = Number(shift.startingCash) + totalCashIn
  const overShort = data.endingCashCounted - expectedCash

  return prisma.shift.update({
    where: { id: shiftId },
    data: {
      endingCashCounted: data.endingCashCounted,
      expectedCash,
      overShort,
      status: "CLOSED",
      closedBy: data.closedBy,
      closedAt: new Date(),
      notes: data.notes ? `${shift.notes || ""}\n[Closing] ${data.notes}`.trim() : shift.notes,
    },
  })
}

export async function getShiftSummary(shiftId: string) {
  const shift = await prisma.shift.findUnique({ where: { id: shiftId } })
  if (!shift) throw new Error("Shift not found.")

  const endTime = shift.closedAt || new Date()

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: shift.openedAt, lte: endTime },
    },
  })

  const breakdown: Record<string, number> = {}
  payments.forEach(p => {
    breakdown[p.method] = (breakdown[p.method] || 0) + Number(p.amount)
  })

  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0)
  const orderCount = await prisma.order.count({
    where: {
      paymentStatus: "PAID",
      updatedAt: { gte: shift.openedAt, lte: endTime },
    },
  })

  return {
    shift,
    breakdown,
    totalRevenue,
    orderCount,
    totalTransactions: payments.length,
  }
}

export async function getShiftHistory(filters?: { from?: string; to?: string }) {
  const where: any = { status: "CLOSED" }
  if (filters?.from || filters?.to) {
    where.openedAt = {}
    if (filters.from) where.openedAt.gte = new Date(filters.from)
    if (filters.to) where.openedAt.lte = new Date(filters.to)
  }

  const shifts = await prisma.shift.findMany({
    where,
    orderBy: { openedAt: "desc" },
  })

  const userIds = [...new Set([...shifts.map(s => s.openedBy), ...shifts.map(s => s.closedBy).filter(Boolean) as string[]])]
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]))

  return shifts.map(s => ({
    ...s,
    openedByName: userMap[s.openedBy] || "Unknown",
    closedByName: s.closedBy ? (userMap[s.closedBy] || "Unknown") : null,
  }))
}