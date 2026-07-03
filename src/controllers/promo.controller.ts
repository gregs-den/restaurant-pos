import { Response } from "express"
import { AuthRequest } from "../middleware/auth.middleware"
import * as promoService from "../services/promo.service"

export async function getPromos(req: AuthRequest, res: Response) {
  const promos = await promoService.getPromos()
  res.json(promos)
}

export async function createPromo(req: AuthRequest, res: Response) {
  try {
    const promo = await promoService.createPromo(req.body)
    res.status(201).json(promo)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function updatePromo(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string
    const promo = await promoService.updatePromo(id, req.body)
    res.json(promo)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function deletePromo(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string
    await promoService.deletePromo(id)
    res.json({ message: "Promo deleted." })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function applyPromo(req: AuthRequest, res: Response) {
  try {
    const orderId = req.params.id as string
    const { code } = req.body
    const result = await promoService.applyPromoToOrder(orderId, code)
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function applySpecialDiscount(req: AuthRequest, res: Response) {
  try {
    const orderId = req.params.id as string
    const { type, seniorCount, totalPersons } = req.body
    if (!seniorCount || seniorCount < 1) return res.status(400).json({ error: "Enter number of seniors/PWDs." })
    if (!totalPersons || totalPersons < seniorCount) return res.status(400).json({ error: "Total persons must be >= senior count." })
    const result = await promoService.applySpecialDiscount(orderId, type, seniorCount, totalPersons)
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}