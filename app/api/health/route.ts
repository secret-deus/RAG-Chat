import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // 检查数据库连接
    await db.execute("SELECT 1")

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        application: "running",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Database connection failed",
      },
      { status: 503 },
    )
  }
}
