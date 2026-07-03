import path from "path"
import { defineConfig } from "prisma/config"
import { PrismaPg } from "@prisma/adapter-pg"
import * as dotenv from "dotenv"

dotenv.config()

const DATABASE_URL = process.env.DATABASE_URL!

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "prisma/schema.prisma"),
  datasource: {
    url: DATABASE_URL,
  },
  migrate: {
    async adapter() {
      return new PrismaPg({
        connectionString: DATABASE_URL,
      })
    },
  },
})