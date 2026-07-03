import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import * as dotenv from "dotenv"

dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10)

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@pos.com",
      passwordHash,
      pin: "1234",
      role: "ADMIN",
    },
  })

  console.log("✅ Test admin created:", admin.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())