import { type NextRequest, NextResponse } from "next/server"
import { db, apiConfigs } from "@/lib/db"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const configs = await db.select().from(apiConfigs).orderBy(apiConfigs.createdAt)
    return NextResponse.json(configs)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch configs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, provider, model, apiKey, baseUrl, isActive } = body

    if (isActive) {
      // Deactivate other configs of the same type
      await db.update(apiConfigs).set({ isActive: false }).where(eq(apiConfigs.type, type))
    }

    const [newConfig] = await db
      .insert(apiConfigs)
      .values({
        name,
        type,
        provider,
        model,
        apiKey,
        baseUrl,
        isActive: isActive || false,
      })
      .returning()

    return NextResponse.json(newConfig)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create config" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, isActive } = body

    if (isActive) {
      const config = await db.select().from(apiConfigs).where(eq(apiConfigs.id, id)).limit(1)
      if (config.length > 0) {
        // Deactivate other configs of the same type
        await db.update(apiConfigs).set({ isActive: false }).where(eq(apiConfigs.type, config[0].type))
      }
    }

    const [updatedConfig] = await db.update(apiConfigs).set({ isActive }).where(eq(apiConfigs.id, id)).returning()

    return NextResponse.json(updatedConfig)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 })
  }
}
