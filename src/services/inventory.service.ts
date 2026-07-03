import prisma from "./prisma"

// ===== Ingredients =====
export async function getIngredients() {
  return prisma.ingredient.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  })
}

export async function createIngredient(data: {
  name: string
  unit: "G" | "KG" | "ML" | "L" | "PCS" | "DOZEN"
  currentStock?: number
  lowStockAlert?: number
}) {
  return prisma.ingredient.create({ data })
}

export async function updateIngredient(id: string, data: Partial<{
  name: string
  unit: "G" | "KG" | "ML" | "L" | "PCS" | "DOZEN"
  lowStockAlert: number
}>) {
  return prisma.ingredient.update({ where: { id }, data })
}

export async function deleteIngredient(id: string) {
  return prisma.ingredient.update({ where: { id }, data: { isActive: false } })
}

// ===== Stock Movements =====
export async function adjustStock(data: {
  ingredientId: string
  type: "IN" | "OUT" | "ADJUSTMENT" | "WASTE"
  quantity: number
  notes?: string
  orderId?: string
  createdBy: string
}) {
  const ingredient = await prisma.ingredient.findUnique({ where: { id: data.ingredientId } })
  if (!ingredient) throw new Error("Ingredient not found")

  let newStock = Number(ingredient.currentStock)
  if (data.type === "IN" || data.type === "ADJUSTMENT") {
    newStock += data.quantity
  } else {
    newStock -= data.quantity
    if (newStock < 0) newStock = 0
  }

  const [movement] = await Promise.all([
    prisma.stockMovement.create({
      data: {
        ingredientId: data.ingredientId,
        type: data.type,
        quantity: data.quantity,
        notes: data.notes,
        orderId: data.orderId,
        createdBy: data.createdBy,
      },
    }),
    prisma.ingredient.update({
      where: { id: data.ingredientId },
      data: { currentStock: newStock },
    }),
  ])

  return movement
}

export async function getStockMovements(ingredientId?: string) {
  return prisma.stockMovement.findMany({
    where: ingredientId ? { ingredientId } : undefined,
    include: { ingredient: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
}

// ===== Menu Item Ingredients =====
export async function getMenuItemIngredients(menuItemId: string) {
  return prisma.menuItemIngredient.findMany({
    where: { menuItemId },
    include: { ingredient: true },
  })
}

export async function setMenuItemIngredients(menuItemId: string, ingredients: { ingredientId: string; quantity: number }[]) {
  // Delete existing
  await prisma.menuItemIngredient.deleteMany({ where: { menuItemId } })

  // Create new
  if (ingredients.length > 0) {
    await prisma.menuItemIngredient.createMany({
      data: ingredients.map(i => ({
        menuItemId,
        ingredientId: i.ingredientId,
        quantity: i.quantity,
      })),
    })
  }

  return getMenuItemIngredients(menuItemId)
}

// ===== Auto-deduct when order is placed =====
export async function deductStockForOrder(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        include: {
          menuItem: {
            include: { menuItemIngredients: { include: { ingredient: true } } }
          }
        }
      }
    }
  })

  if (!order) throw new Error("Order not found")

  for (const orderItem of order.orderItems) {
    for (const mii of orderItem.menuItem.menuItemIngredients) {
      const totalQty = Number(mii.quantity) * orderItem.quantity
      await adjustStock({
        ingredientId: mii.ingredientId,
        type: "OUT",
        quantity: totalQty,
        notes: `Auto-deduct for order #${orderId.slice(-6)}`,
        orderId,
        createdBy: userId,
      })
    }
  }
}

// ===== Low stock alerts =====
export async function getLowStockIngredients() {
  const ingredients = await prisma.ingredient.findMany({
    where: { isActive: true },
  })
  return ingredients.filter(i => Number(i.currentStock) <= Number(i.lowStockAlert))
}

export async function deductStockForOrderItem(orderItemId: string, userId: string) {
  const orderItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: {
      menuItem: {
        include: {
          menuItemIngredients: {
            include: { ingredient: true }
          }
        }
      }
    }
  })

  if (!orderItem) return
  if (!orderItem.menuItem.menuItemIngredients.length) return // no recipe set, skip

  for (const mii of orderItem.menuItem.menuItemIngredients) {
    const totalQty = Number(mii.quantity) * orderItem.quantity
    await adjustStock({
      ingredientId: mii.ingredientId,
      type: "OUT",
      quantity: totalQty,
      notes: `Auto-deduct: ${orderItem.menuItem.name} x${orderItem.quantity}`,
      orderId: orderItem.orderId,
      createdBy: userId,
    })
  }
}