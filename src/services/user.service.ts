import bcrypt from "bcryptjs"
import prisma from "./prisma"

export async function getUsers() {
  return prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      pin: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  })
}

export async function createUser(data: {
  name: string
  email: string
  password: string
  pin?: string
  role: "ADMIN" | "MANAGER" | "CASHIER" | "WAITER"
}) {
  const passwordHash = await bcrypt.hash(data.password, 10)
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      pin: data.pin || null,
      role: data.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      pin: true,
      isActive: true,
      createdAt: true,
    },
  })
}

export async function updateUser(id: string, data: {
  name?: string
  email?: string
  password?: string
  pin?: string
  role?: "ADMIN" | "MANAGER" | "CASHIER" | "WAITER"
}) {
  const updateData: any = {}
  if (data.name) updateData.name = data.name
  if (data.email) updateData.email = data.email
  if (data.pin !== undefined) updateData.pin = data.pin || null
  if (data.role) updateData.role = data.role
  if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 10)

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      pin: true,
      isActive: true,
      createdAt: true,
    },
  })
}

export async function deactivateUser(id: string) {
  return prisma.user.update({
    where: { id },
    data: { isActive: false },
  })
}