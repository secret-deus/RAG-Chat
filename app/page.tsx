"use client"

import { useChat } from "ai/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { MessageCircle, Plus, Settings, BookOpen, Brain } from "lucide-react"
import Link from "next/link"

interface ChatSession {
  id: string
  title: string
  createdAt: string
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [showReasoning, setShowReasoning] = useState(false)
  const [knowledgeBaseMap, setKnowledgeBaseMap] = useState<Record<string, string>>({})

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    body: {
      sessionId: currentSessionId,
    },
  })

  useEffect(() => {
    fetchSessions()
    fetchKnowledgeBase()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/chat-sessions")
      const data = await response.json()
      setSessions(data)
    } catch (error) {
      console.error("Failed to fetch sessions:", error)
    }
  }

  const fetchKnowledgeBase = async () => {
    try {
      const response = await fetch("/api/knowledge-base")
      const data = await response.json()
      const map: Record<string, string> = {}
      data.forEach((item: any) => {
        map[item.id] = item.name
      })
      setKnowledgeBaseMap(map)
    } catch (error) {
      console.error("Failed to fetch knowledge base:", error)
    }
  }

  const createNewSession = async () => {
    try {
      const response = await fetch("/api/chat-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      })
      const newSession = await response.json()
      setSessions([newSession, ...sessions])
      setCurrentSessionId(newSession.id)
    } catch (error) {
      console.error("Failed to create session:", error)
    }
  }

  const loadSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId)
    // Load messages for this session
    try {
      const response = await fetch(`/api/chat-sessions/${sessionId}/messages`)
      const sessionMessages = await response.json()
      // You would need to set these messages in the chat hook
      // This requires extending the useChat hook or managing messages separately
    } catch (error) {
      console.error("Failed to load session messages:", error)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-3">
          <Button onClick={createNewSession} className="w-full mb-3 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>

          <div className="space-y-1">
            <Link href="/knowledge">
              <Button variant="ghost" className="w-full justify-start text-gray-700">
                <BookOpen className="h-4 w-4 mr-2" />
                Knowledge Base
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" className="w-full justify-start text-gray-700">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        <Separator />

        <ScrollArea className="flex-1 py-2">
          <div className="space-y-1 px-1">
            {sessions.map((session) => (
              <Button
                key={session.id}
                variant={currentSessionId === session.id ? "secondary" : "ghost"}
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => loadSession(session.id)}
              >
                <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate text-sm">{session.title}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="border-b p-3 flex items-center justify-between bg-white">
          <h1 className="text-lg font-medium">RAG Chat</h1>
          <Button variant="outline" size="sm" onClick={() => setShowReasoning(!showReasoning)}>
            <Brain className="h-4 w-4 mr-2" />
            {showReasoning ? "Hide" : "Show"} Reasoning
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-2xl mx-auto">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] ${message.role === "user" ? "bg-blue-100 text-blue-900" : "bg-gray-100"} rounded-lg px-4 py-2`}
                >
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>

                  {/* 显示数据来源 */}
                  {message.role === "assistant" &&
                    message.extraFields?.sources &&
                    message.extraFields.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                        <p className="font-medium">Sources:</p>
                        <ul className="list-disc list-inside">
                          {message.extraFields.sources.map((sourceId: string, index: number) => (
                            <li key={index}>{knowledgeBaseMap[sourceId] || sourceId}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* 显示思考过程 */}
                  {message.role === "assistant" &&
                    showReasoning &&
                    message.parts?.some((part) => part.type === "reasoning") && (
                      <details className="mt-2 pt-2 border-t border-gray-200">
                        <summary className="cursor-pointer text-xs text-gray-500">Reasoning Process</summary>
                        <div className="mt-1 text-xs bg-gray-50 p-2 rounded">
                          {message.parts
                            ?.filter((part) => part.type === "reasoning")
                            .map((part, idx) => (
                              <div key={idx} className="whitespace-pre-wrap">
                                {part.details?.map((detail) => (detail.type === "text" ? detail.text : "")).join("")}
                              </div>
                            ))}
                        </div>
                      </details>
                    )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-3 bg-white">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="flex space-x-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask a question..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                Send
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
