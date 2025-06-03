import { Index } from "@upstash/vector"

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
})

export function generateChunks(input: string): string[] {
  return input
    .trim()
    .split(/[.!?]+/)
    .filter((chunk) => chunk.trim().length > 0)
    .map((chunk) => chunk.trim())
}

export async function upsertEmbedding(resourceId: string, content: string) {
  const chunks = generateChunks(content)

  const toUpsert = chunks.map((chunk, i) => ({
    id: `${resourceId}-${i}`,
    data: chunk,
    metadata: {
      resourceId,
      content: chunk,
    },
  }))

  await index.upsert(toUpsert)
}

export async function findRelevantContent(query: string, k = 4) {
  const result = await index.query({
    data: query,
    topK: k,
    includeMetadata: true,
  })

  // 确保结果包含完整的元数据
  return result.map((item) => ({
    ...item,
    metadata: {
      ...item.metadata,
      resourceId: item.metadata?.resourceId || "unknown",
    },
  }))
}

export async function deleteEmbeddings(resourceId: string) {
  // Get all vectors for this resource
  const vectors = await index.query({
    data: "",
    topK: 1000,
    includeMetadata: true,
    filter: `resourceId = '${resourceId}'`,
  })

  // Delete all vectors
  const ids = vectors.map((v) => v.id)
  if (ids.length > 0) {
    await index.delete(ids)
  }
}

export { index }
