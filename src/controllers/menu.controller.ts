import { Request, Response } from "express"
import * as menuService from "../services/menu.service"

export async function listCategories(req: Request, res: Response) {
  const categories = await menuService.getCategories()
  res.json(categories)
}

export async function createCategory(req: Request, res: Response) {
  try {
    const category = await menuService.createCategory(req.body)
    res.status(201).json(category)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function updateCategory(req: Request, res: Response) {
  try {
    const id = req.params.id as string
    const category = await menuService.updateCategory(id, req.body)

    req.app.get("io").emit("menu-updated")

    res.json(category)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function deleteCategory(req: Request, res: Response) {
  try {
    const id = req.params.id as string
    await menuService.deleteCategory(id)

    req.app.get("io").emit("menu-updated")

    res.json({ message: "Category deleted" })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function listMenuItems(req: Request, res: Response) {
  const items = await menuService.getMenuItems()
  res.json(items)
}

export async function getMenuItem(req: Request, res: Response) {
  const id = req.params.id as string
  const item = await menuService.getMenuItemById(id)
  if (!item) return res.status(404).json({ error: "Item not found" })
  res.json(item)
}

export async function createMenuItem(req: Request, res: Response) {
  try {
    const item = await menuService.createMenuItem(req.body)

    req.app.get("io").emit("menu-updated")

    res.status(201).json(item)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function updateMenuItem(req: Request, res: Response) {
  try {
    const id = req.params.id as string
    const item = await menuService.updateMenuItem(id, req.body)

    req.app.get("io").emit("menu-updated")

    res.json(item)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function toggleAvailability(req: Request, res: Response) {
  try {
    const id = req.params.id as string
    const item = await menuService.toggleMenuItemAvailability(id)

    req.app.get("io").emit("menu-updated")

    res.json(item)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function deleteMenuItem(req: Request, res: Response) {
  try {
    const id = req.params.id as string
    await menuService.deleteMenuItem(id)

    req.app.get("io").emit("menu-updated")

    res.json({ message: "Item deleted" })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function createModifierGroup(req: Request, res: Response) {
  try {
    const group = await menuService.createModifierGroup(req.body)
    res.status(201).json(group)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function addModifier(req: Request, res: Response) {
  try {
    const groupId = req.params.groupId as string
    const modifier = await menuService.addModifier(groupId, req.body)
    res.status(201).json(modifier)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function deleteModifier(req: Request, res: Response) {
  try {
    const id = req.params.id as string
    await menuService.deleteModifier(id)
    res.json({ message: "Modifier deleted" })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}