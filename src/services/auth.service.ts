import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import prisma from "./prisma"

const JWT_SECRET = process.env.JWT_SECRET!

export async function loginWithEmail(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !user.isActive) {
    throw new Error("Invalid credentials")
  }

  const isValid = await bcrypt.compare(password, user.passwordHash)
  if (!isValid) {
    throw new Error("Invalid credentials")
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "12h" }
  )

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  }
}

export async function loginWithPin(pin: string) {
  const user = await prisma.user.findFirst({ where: { pin, isActive: true } })

  if (!user) {
    throw new Error("Invalid PIN")
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "12h" }
  )

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
    },
  }
}