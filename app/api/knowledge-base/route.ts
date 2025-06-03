import { type NextRequest, NextResponse } from "next/server"
import { db, knowledgeBase } from "@/lib/db"
import { upsertEmbedding, deleteEmbeddings } from "@/lib/vector"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const knowledge = await db.select().from(knowledgeBase).orderBy(knowledgeBase.createdAt)
    return NextResponse.json(knowledge)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch knowledge base" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const name = formData.get("name") as string
    const description = formData.get("description") as string

    if (!file || !name) {
      return NextResponse.json({ error: "File and name are required" }, { status: 400 })
    }

    const content = await file.text()
    const chunks = content.split(/[.!?]+/).filter((chunk) => chunk.trim().length > 0)

    const [newKnowledge] = await db
      .insert(knowledgeBase)
      .values({
        name,
        description,
        fileName: file.name,
        fileSize: file.size,
        content,
        chunks,
      })
      .returning()

    // Upsert to vector database
    await upsertEmbedding(newKnowledge.id, content)

    return NextResponse.json(newKnowledge)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create knowledge base entry" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    // Delete from vector database
    await deleteEmbeddings(id)

    // Delete from database
    await db.delete(knowledgeBase).where(eq(knowledgeBase.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete knowledge base entry" }, { status: 500 })
  }
}
