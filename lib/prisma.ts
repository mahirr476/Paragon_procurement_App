let prisma: any = null

// Only run this code on the server
if (typeof window === "undefined") {
  try {
    const { PrismaClient } = require("@prisma/client")

    const globalForPrisma = globalThis as unknown as {
      prisma: any | undefined
    }

    prisma =
      globalForPrisma.prisma ??
      new PrismaClient({
        log: ["error", "warn"],
      })

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prisma
    }

    console.log("[v0] Prisma initialized successfully with Neon database")
  } catch (error) {
    console.error("[v0] Prisma initialization failed:", error instanceof Error ? error.message : String(error))
    throw new Error("Database connection required. Please ensure Prisma is set up correctly.")
  }
} else {
  console.log("[v0] Prisma initialization skipped on client side")
}

export { prisma }
export default prisma
