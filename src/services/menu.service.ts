import prisma from "./prisma"

// ===== Categories =====
export async function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  })
}

export async function createCategory(data: { name: string; description?: string; sortOrder?: number }) {
  return prisma.category.create({ data })
}

export async function updateCategory(id: string, data: { name?: string; description?: string; sortOrder?: number; isDiscountable?: boolean }) {
  return prisma.category.update({ where: { id }, data })
}

export async function deleteCategory(id: string) {
  return prisma.category.update({ where: { id }, data: { isActive: false } })
}

// ===== Menu Items =====
export async function getMenuItems() {
  return prisma.menuItem.findMany({
    where: { isActive: true },
    include: { category: true },
  })
}

export async function getMenuItemById(id: string) {
  return prisma.menuItem.findUnique({
    where: { id },
    include: {
      category: true,
      modifierGroups: { include: { modifiers: true } },
    },
  })
}

export async function createMenuItem(data: {
  categoryId: string
  name: string
  description?: string
  price: number
  imageUrl?: string
}) {
  return prisma.menuItem.create({ data })
}

export async function updateMenuItem(id: string, data: Partial<{
  categoryId: string
  name: string
  description: string
  price: number
  imageUrl: string
}>) {
  return prisma.menuItem.update({ where: { id }, data })
}

export async function toggleMenuItemAvailability(id: string) {
  const item = await prisma.menuItem.findUnique({ where: { id } })
  if (!item) throw new Error("Item not found")
  return prisma.menuItem.update({
    where: { id },
    data: { isAvailable: !item.isAvailable },
  })
}

export async function deleteMenuItem(id: string) {
  return prisma.menuItem.update({ where: { id }, data: { isActive: false } })
}

// ===== Modifier Groups =====
export async function createModifierGroup(data: {
  menuItemId: string
  name: string
  isRequired?: boolean
  minSelect?: number
  maxSelect?: number
}) {
  return prisma.modifierGroup.create({ data })
}

export async function addModifier(modifierGroupId: string, data: { name: string; additionalPrice: number }) {
  return prisma.modifier.create({
    data: { modifierGroupId, ...data },
  })
}

export async function deleteModifier(id: string) {
  return prisma.modifier.delete({ where: { id } })
}