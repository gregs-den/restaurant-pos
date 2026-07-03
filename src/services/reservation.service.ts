import prisma from "./prisma"

export async function getReservations(date?: string) {
  const where: any = {}

  if (date) {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)
    where.reservedAt = { gte: start, lte: end }
  }

  return prisma.reservation.findMany({
    where,
    include: { table: true },
    orderBy: { reservedAt: "asc" },
  })
}

export async function createReservation(data: {
  tableId?: string
  guestName: string
  guestPhone?: string
  partySize: number
  reservedAt: string
  notes?: string
  createdBy: string
}) {
  // Check for conflicts if table is specified
  if (data.tableId) {
    const reservedAt = new Date(data.reservedAt)
    const windowStart = new Date(reservedAt.getTime() - 90 * 60 * 1000) // 1.5hr before
    const windowEnd = new Date(reservedAt.getTime() + 90 * 60 * 1000)   // 1.5hr after

    const conflict = await prisma.reservation.findFirst({
      where: {
        tableId: data.tableId,
        status: { in: ["PENDING", "CONFIRMED"] },
        reservedAt: { gte: windowStart, lte: windowEnd },
      },
    })

    if (conflict) {
      throw new Error(`Table already reserved at ${new Date(conflict.reservedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Please choose a different table or time.`)
    }
  }

  return prisma.reservation.create({
    data: {
      tableId: data.tableId || null,
      guestName: data.guestName,
      guestPhone: data.guestPhone || null,
      partySize: data.partySize,
      reservedAt: new Date(data.reservedAt),
      notes: data.notes || null,
      createdBy: data.createdBy,
    },
    include: { table: true },
  })
}

export async function updateReservation(id: string, data: Partial<{
  tableId: string
  guestName: string
  guestPhone: string
  partySize: number
  reservedAt: string
  notes: string
  status: "PENDING" | "CONFIRMED" | "SEATED" | "CANCELLED" | "NO_SHOW"
}>) {
  return prisma.reservation.update({
    where: { id },
    data: {
      ...data,
      reservedAt: data.reservedAt ? new Date(data.reservedAt) : undefined,
    },
    include: { table: true },
  })
}

export async function updateReservationStatus(id: string, status: "PENDING" | "CONFIRMED" | "SEATED" | "CANCELLED" | "NO_SHOW") {
  const reservation = await prisma.reservation.update({
    where: { id },
    data: { status },
    include: { table: true },
  })

  // If seated, mark table as occupied
  if (status === "SEATED" && reservation.tableId) {
    await prisma.table.update({
      where: { id: reservation.tableId },
      data: { status: "OCCUPIED" },
    })
  }

  // If cancelled or no-show, free the table if it was reserved
  if ((status === "CANCELLED" || status === "NO_SHOW") && reservation.tableId) {
    const otherActive = await prisma.reservation.findFirst({
      where: {
        tableId: reservation.tableId,
        status: { in: ["PENDING", "CONFIRMED", "SEATED"] },
        id: { not: id },
      },
    })
    if (!otherActive) {
      await prisma.table.update({
        where: { id: reservation.tableId },
        data: { status: "AVAILABLE" },
      })
    }
  }

  return reservation
}

export async function deleteReservation(id: string) {
  return prisma.reservation.delete({ where: { id } })
}

export async function getTodayReservations() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  return prisma.reservation.findMany({
    where: {
      reservedAt: { gte: today, lte: end },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    include: { table: true },
    orderBy: { reservedAt: "asc" },
  })
}