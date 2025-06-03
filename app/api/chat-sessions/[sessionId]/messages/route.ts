import { type NextRequest, NextResponse } from "next/server"
import { db, chatMessages } from "@/lib/db"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, params.sessionId))
      .orderBy(chatMessages.createdAt)

    return NextResponse.json(messages)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const { role, content, reasoning, metadata } = await request.json()

    const [newMessage] = await db
      .insert(chatMessages)
      .values({
        sessionId: params.sessionId,
        role,
        content,
        reasoning,
        metadata: metadata || {},
      })
      .returning()

    return NextResponse.json(newMessage)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}
