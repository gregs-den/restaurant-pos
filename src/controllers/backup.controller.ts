import { Response } from "express"
import { AuthRequest } from "../middleware/auth.middleware"
import * as backupService from "../services/backup.service"

export async function exportFullBackup(req: AuthRequest, res: Response) {
  try {
    const backup = await backupService.exportFullBackup()
    res.json(backup)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}