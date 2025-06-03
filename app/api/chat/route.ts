import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { findRelevantContent } from "@/lib/vector"
import { db, apiConfigs } from "@/lib/db"
import { eq } from "drizzle-orm"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, sessionId } = await req.json()

    // Get active LLM config
    const [llmConfig] = await db
      .select()
      .from(apiConfigs)
      .where(eq(apiConfigs.type, "llm"))
      .where(eq(apiConfigs.isActive, true))
      .limit(1)

    if (!llmConfig) {
      return new Response("No active LLM configuration found", { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]

    // 修改findRelevantContent的处理方式，保留来源信息
    const relevantContent = await findRelevantContent(lastMessage.content)
    const context = relevantContent
      .map((item) => item.metadata?.content)
      .filter(Boolean)
      .join("\n\n")

    // 添加来源信息，用于在UI中显示
    const sources = relevantContent
      .filter((item) => item.metadata?.resourceId)
      .map((item) => item.metadata?.resourceId)
      .filter((value, index, self) => self.indexOf(value) === index) // 去重

    // 修改系统消息，添加来源引用格式指导
    const systemMessage = {
      role: "system",
      content: `You are a helpful assistant. Use the following context to answer questions. If the context doesn't contain relevant information, say so clearly.

Context:
${context}

Instructions:
- Answer based on the provided context
- If the context is insufficient, acknowledge this limitation
- Be concise and accurate
- When referencing information, cite the source using [Source ID] format`,
    }

    // Configure model based on config
    let model
    if (llmConfig.provider === "openai") {
      model = openai(llmConfig.model, {
        apiKey: llmConfig.apiKey,
        baseURL: llmConfig.baseUrl,
      })
    } else {
      // Add support for other providers here
      model = openai(llmConfig.model, {
        apiKey: llmConfig.apiKey,
        baseURL: llmConfig.baseUrl,
      })
    }

    // 在streamText结果中添加sources信息
    const result = streamText({
      model,
      messages: [systemMessage, ...messages],
      onFinish: async (result) => {
        // Save messages to database
        if (sessionId) {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/chat-sessions/${sessionId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: "user",
              content: lastMessage.content,
            }),
          })

          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/chat-sessions/${sessionId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: "assistant",
              content: result.text,
              reasoning: result.reasoning,
              metadata: { sources },
            }),
          })
        }
      },
    })

    // 在响应中添加sources信息
    return result.toDataStreamResponse({
      sendReasoning: true,
      extraFields: { sources },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response("Internal server error", { status: 500 })
  }
}
