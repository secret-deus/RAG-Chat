import { type NextRequest, NextResponse } from "next/server"
import { db, chatSessions } from "@/lib/db"
import { desc } from "drizzle-orm"

export async function GET() {
  try {
    const sessions = await db.select().from(chatSessions).orderBy(desc(chatSessions.updatedAt))
    return NextResponse.json(sessions)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json()

    const [newSession] = await db
      .insert(chatSessions)
      .values({
        title: title || "New Chat",
      })
      .returning()

    return NextResponse.json(newSession)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}
