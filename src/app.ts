import express from "express"
import cors from "cors"
import helmet from "helmet"
import dotenv from "dotenv"
import { createServer } from "http"
import { Server } from "socket.io"

import authRoutes from "./routes/auth.routes"
import menuRoutes from "./routes/menu.routes"
import orderRoutes from "./routes/order.routes"
import userRoutes from "./routes/user.routes"
import promoRoutes from "./routes/promo.routes"
import inventoryRoutes from "./routes/inventory.routes"
import reservationRoutes from "./routes/reservation.routes"
import shiftRoutes from "./routes/shift.routes"
import backupRoutes from "./routes/backup.routes"
import path from "path"

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: "*" },
})

// Make io accessible in controllers
app.set("io", io)

// Middleware
app.use(cors())
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      connectSrc: ["'self'", "https://cdnjs.cloudflare.com", "wss:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    }
  }
}))
app.use(express.json())

app.use(express.static(path.join(__dirname, "../public")))

// Routes
app.use("/", userRoutes)
app.use("/auth", authRoutes)
app.use("/", menuRoutes)
app.use("/", orderRoutes)
app.use("/", promoRoutes)
app.use("/", inventoryRoutes)
app.use("/", reservationRoutes)
app.use("/", shiftRoutes)
app.use("/", backupRoutes)

// Socket.io connection
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id)

  socket.on("join-kitchen", () => {
    socket.join("kitchen")
    console.log(`👨‍🍳 ${socket.id} joined kitchen room`)
  })

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id)
  })
})

const PORT = process.env.PORT || 3000

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})

export default app