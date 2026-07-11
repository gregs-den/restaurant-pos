    import prisma from "./prisma"
    
    export async function exportFullBackup() {
    const [
        users, categories, menuItems, modifierGroups, modifiers,
        tables, orders, orderItems, orderItemModifiers, payments,
        promos, ingredients, menuItemIngredients, stockMovements,
        reservations, voidLogs, shifts, setMealComponents, orderItemComponents
    ] = await Promise.all([
        prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, pin: true, isActive: true, createdAt: true } }), // no passwordHash
        prisma.category.findMany(),
        prisma.menuItem.findMany(),
        prisma.modifierGroup.findMany(),
        prisma.modifier.findMany(),
        prisma.table.findMany(),
        prisma.order.findMany(),
        prisma.orderItem.findMany(),
        prisma.orderItemModifier.findMany(),
        prisma.payment.findMany(),
        prisma.promo.findMany(),
        prisma.ingredient.findMany(),
        prisma.menuItemIngredient.findMany(),
        prisma.stockMovement.findMany(),
        prisma.reservation.findMany(),
        prisma.voidLog.findMany(),
        prisma.shift.findMany(),
        prisma.setMealComponent.findMany(),
        prisma.orderItemComponent.findMany(),
    ])

    return {
        exportedAt: new Date().toISOString(),
        counts: {
        users: users.length, orders: orders.length, payments: payments.length,
        },
        data: {
        users, categories, menuItems, modifierGroups, modifiers,
        tables, orders, orderItems, orderItemModifiers, payments,
        promos, ingredients, menuItemIngredients, stockMovements,
        reservations, voidLogs, shifts, setMealComponents, orderItemComponents
        }
    }
    }