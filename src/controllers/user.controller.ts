import { Response } from "express"
import { AuthRequest } from "../middleware/auth.middleware"
import * as userService from "../services/user.service"

export async function getUsers(req: AuthRequest, res: Response) {
  const users = await userService.getUsers()
  res.json(users)
}

export async function createUser(req: AuthRequest, res: Response) {
  try {
    const user = await userService.createUser(req.body)
    res.status(201).json(user)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string
    const user = await userService.updateUser(id, req.body)
    res.json(user)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function deactivateUser(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string
    // Prevent deactivating yourself
    if (id === req.user!.userId) {
      return res.status(400).json({ error: "You cannot deactivate your own account." })
    }
    await userService.deactivateUser(id)
    res.json({ message: "User deactivated." })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}