import prisma from "./prisma"
import { adjustStock } from "./inventory.service"

// Add an order item WITH its actual components (defaults or substituted)
export async function addOrderItemWithComponents(
  orderId: string,
  data: {
    menuItemId: string
    quantity: number
    notes?: string
    components?: { componentId: string; quantity: number; isSubstituted?: boolean }[]
  }
) {
  const menuItem = await prisma.menuItem.findUnique({ where: { id: data.menuItemId } })
  if (!menuItem) throw new Error("Menu item not found")

  const unitPrice = Number(menuItem.price)
  const subtotal = unitPrice * data.quantity

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

  // If this menu item has default set-meal components and none were provided, use defaults
  let componentsToUse = data.components

  if (!componentsToUse || componentsToUse.length === 0) {
    const defaults = await prisma.setMealComponent.findMany({
      where: { setMenuItemId: data.menuItemId },
    })
    if (defaults.length > 0) {
      componentsToUse = defaults.map(d => ({
        componentId: d.componentId,
        quantity: d.quantity,
        isSubstituted: false,
      }))
    }
  }

  // Save the actual components served (for this specific order item)
  if (componentsToUse && componentsToUse.length > 0) {
    await prisma.orderItemComponent.createMany({
      data: componentsToUse.map(c => ({
        orderItemId: orderItem.id,
        componentId: c.componentId,
        quantity: c.quantity * data.quantity, // scale by how many sets ordered
        isSubstituted: c.isSubstituted || false,
      })),
    })
  }

  return prisma.orderItem.findUnique({
    where: { id: orderItem.id },
    include: {
      menuItem: true,
      components: { include: { component: true } },
      orderItemModifiers: true,
    },
  })
}

// Deduct stock based on ACTUAL components served (not the fixed recipe)
export async function deductStockForOrderItemComponents(orderItemId: string, userId: string) {
  const orderItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: {
      menuItem: { include: { menuItemIngredients: true } },
      components: { include: { component: { include: { menuItemIngredients: true } } } },
    },
  })

  if (!orderItem) return

  // Case 1: This is a set meal with components — deduct based on each component's recipe
  if (orderItem.components.length > 0) {
    for (const oic of orderItem.components) {
      for (const mii of oic.component.menuItemIngredients) {
        const totalQty = Number(mii.quantity) * oic.quantity
        await adjustStock({
          ingredientId: mii.ingredientId,
          type: "OUT",
          quantity: totalQty,
          notes: `Auto-deduct: ${orderItem.menuItem.name} → ${oic.component.name}${oic.isSubstituted ? " (substituted)" : ""}`,
          orderId: orderItem.orderId,
          createdBy: userId,
        })
      }
    }
    return
  }

  // Case 2: Regular item (no components) — deduct based on its own recipe, as before
  if (orderItem.menuItem.menuItemIngredients.length > 0) {
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
}