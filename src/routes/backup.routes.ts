import { Router } from "express"
import * as backupController from "../controllers/backup.controller"
import { authenticate } from "../middleware/auth.middleware"
import { requireRole } from "../middleware/role.middleware"

const router = Router()

router.get("/admin/export-backup", authenticate, requireRole("ADMIN"), backupController.exportFullBackup)

export default router