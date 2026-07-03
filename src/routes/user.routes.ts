import { Router } from "express"
import * as userController from "../controllers/user.controller"
import { authenticate } from "../middleware/auth.middleware"
import { requireRole } from "../middleware/role.middleware"

const router = Router()

router.get("/users", authenticate, requireRole("ADMIN", "MANAGER"), userController.getUsers)
router.post("/users", authenticate, requireRole("ADMIN"), userController.createUser)
router.put("/users/:id", authenticate, requireRole("ADMIN"), userController.updateUser)
router.delete("/users/:id", authenticate, requireRole("ADMIN"), userController.deactivateUser)

export default router