import prisma from "./prisma"

export async function getPromos() {
  return prisma.promo.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  })
}

export async function createPromo(data: {
  code: string
  description?: string
  discountType: "PERCENTAGE" | "FIXED"
  discountValue: number
  minOrderAmount?: number
  maxUses?: number
  expiresAt?: string
}) {
  return prisma.promo.create({
    data: {
      code: data.code.toUpperCase().trim(),
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderAmount: data.minOrderAmount || null,
      maxUses: data.maxUses || null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  })
}

export async function updatePromo(id: string, data: Partial<{
  description: string
  discountValue: number
  minOrderAmount: number
  maxUses: number
  isActive: boolean
  expiresAt: string
}>) {
  return prisma.promo.update({
    where: { id },
    data: {
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    },
  })
}

export async function deletePromo(id: string) {
  return prisma.promo.update({ where: { id }, data: { isActive: false } })
}

export async function applyPromoToOrder(orderId: string, code: string) {
  // Find promo
  const promo = await prisma.promo.findFirst({
    where: { code: code.toUpperCase().trim(), isActive: true },
  })

  if (!promo) throw new Error("Invalid promo code.")
  if (promo.expiresAt && new Date() > promo.expiresAt) throw new Error("Promo code has expired.")
  if (promo.maxUses && promo.usedCount >= promo.maxUses) throw new Error("Promo code has reached its usage limit.")

  // Get order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: true },
  })
  if (!order) throw new Error("Order not found.")

  const subtotal = order.orderItems.reduce((s, i) => s + Number(i.subtotal), 0)

  if (promo.minOrderAmount && subtotal < Number(promo.minOrderAmount)) {
    throw new Error(`Minimum order amount of ₱${Number(promo.minOrderAmount).toFixed(2)} required.`)
  }

  // Calculate discount
  let discountAmount = 0
  if (promo.discountType === "PERCENTAGE") {
    discountAmount = subtotal * (Number(promo.discountValue) / 100)
  } else {
    discountAmount = Number(promo.discountValue)
  }
  discountAmount = Math.min(discountAmount, subtotal) // can't discount more than subtotal

  // Apply to order
  const taxableAmount = subtotal - discountAmount
  const taxAmount = taxableAmount * 0.12
  const totalAmount = taxableAmount + taxAmount

  await prisma.order.update({
    where: { id: orderId },
    data: {
      discountAmount,
      subtotal,
      taxAmount,
      totalAmount,
      promoCode: promo.code,
    },
  })

  // Increment promo usage
  await prisma.promo.update({
    where: { id: promo.id },
    data: { usedCount: { increment: 1 } },
  })

  return {
    promo,
    discountAmount,
    subtotal,
    taxAmount,
    totalAmount,
  }
}

// Special discounts (Senior/PWD - 20% per PH law)
export async function applySpecialDiscount(orderId: string, type: "SENIOR" | "PWD", seniorCount: number, totalPersons: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: true }
  })
  if (!order) throw new Error("Order not found.")

  const subtotal = order.orderItems
  .filter(i => i.status !== "CANCELLED")
  .reduce((s, i) => s + Number(i.subtotal), 0)

  const perPersonGross = totalPersons > 0 ? subtotal / totalPersons : subtotal
  const seniorGrossShare = perPersonGross * seniorCount

  // Just take 20% off the senior's share directly
  const discountAmount = seniorGrossShare * 0.20

  const netGross = subtotal - discountAmount
  const vatableSales = netGross / 1.12
  const taxAmount = netGross - vatableSales
  const totalAmount = netGross

  await prisma.order.update({
    where: { id: orderId },
    data: {
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      promoCode: `${type}x${seniorCount}`,
    }
  })

  return {
    type,
    seniorCount,
    totalPersons,
    subtotal,
    seniorGrossShare,
    discountAmount,
    taxAmount,
    totalAmount,
  }
}