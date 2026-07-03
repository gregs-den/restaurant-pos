import { Request, Response } from "express"
import { loginWithEmail, loginWithPin } from "../services/auth.service"
import prisma from "../services/prisma"
import { AuthRequest } from "../middleware/auth.middleware"

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body
    const result = await loginWithEmail(email, password)
    res.json(result)
  } catch (err: any) {
    res.status(401).json({ error: err.message })
  }
}

export async function loginPin(req: Request, res: Response) {
  try {
    const { pin } = req.body
    const result = await loginWithPin(pin)
    res.json(result)
  } catch (err: any) {
    res.status(401).json({ error: err.message })
  }
}

export async function me(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, name: true, email: true, role: true },
  })
  res.json(user)
}