import { Router } from "express"
import { login, loginPin, me } from "../controllers/auth.controller"
import { authenticate } from "../middleware/auth.middleware"

const router = Router()

router.post("/login", login)
router.post("/login/pin", loginPin)
router.get("/me", authenticate, me)

export default router