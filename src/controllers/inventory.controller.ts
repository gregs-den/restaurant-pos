import { Response } from "express"
import { AuthRequest } from "../middleware/auth.middleware"
import * as inventoryService from "../services/inventory.service"

export async function getIngredients(req: AuthRequest, res: Response) {
  const ingredients = await inventoryService.getIngredients()
  res.json(ingredients)
}

export async function createIngredient(req: AuthRequest, res: Response) {
  try {
    const ingredient = await inventoryService.createIngredient(req.body)
    res.status(201).json(ingredient)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function updateIngredient(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string
    const ingredient = await inventoryService.updateIngredient(id, req.body)
    res.json(ingredient)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function deleteIngredient(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string
    await inventoryService.deleteIngredient(id)
    res.json({ message: "Ingredient deleted." })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function adjustStock(req: AuthRequest, res: Response) {
  try {
    const movement = await inventoryService.adjustStock({
      ...req.body,
      createdBy: req.user!.userId,
    })
    res.status(201).json(movement)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function getStockMovements(req: AuthRequest, res: Response) {
  const ingredientId = req.query.ingredientId as string | undefined
  const movements = await inventoryService.getStockMovements(ingredientId)
  res.json(movements)
}

export async function getMenuItemIngredients(req: AuthRequest, res: Response) {
  const menuItemId = req.params.menuItemId as string
  const ingredients = await inventoryService.getMenuItemIngredients(menuItemId)
  res.json(ingredients)
}

export async function setMenuItemIngredients(req: AuthRequest, res: Response) {
  try {
    const menuItemId = req.params.menuItemId as string
    const ingredients = await inventoryService.setMenuItemIngredients(menuItemId, req.body.ingredients)
    res.json(ingredients)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function deductStockForOrder(req: AuthRequest, res: Response) {
  try {
    const orderId = req.params.id as string
    await inventoryService.deductStockForOrder(orderId, req.user!.userId)
    res.json({ message: "Stock deducted successfully." })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function getLowStockAlerts(req: AuthRequest, res: Response) {
  const ingredients = await inventoryService.getLowStockIngredients()
  res.json(ingredients)
}

export async function getSetMealComponents(req: AuthRequest, res: Response) {
  const menuItemId = req.params.menuItemId as string
  const components = await inventoryService.getSetMealComponents(menuItemId)
  res.json(components)
}

export async function setSetMealComponents(req: AuthRequest, res: Response) {
  try {
    const menuItemId = req.params.menuItemId as string
    const components = await inventoryService.setSetMealComponents(menuItemId, req.body.components)
    res.json(components)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}