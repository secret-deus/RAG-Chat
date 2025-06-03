"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Upload, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface KnowledgeItem {
  id: string
  name: string
  description: string
  fileName: string
  fileSize: number
  createdAt: string
}

export default function KnowledgePage() {
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    file: null as File | null,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchKnowledge()
  }, [])

  const fetchKnowledge = async () => {
    try {
      const response = await fetch("/api/knowledge-base")
      const data = await response.json()
      setKnowledge(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch knowledge base",
        variant: "destructive",
      })
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.file || !formData.name) return

    setIsUploading(true)
    const uploadData = new FormData()
    uploadData.append("file", formData.file)
    uploadData.append("name", formData.name)
    uploadData.append("description", formData.description)

    try {
      const response = await fetch("/api/knowledge-base", {
        method: "POST",
        body: uploadData,
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Knowledge base entry created successfully",
        })
        setFormData({ name: "", description: "", file: null })
        fetchKnowledge()
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/knowledge-base?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Knowledge base entry deleted successfully",
        })
        fetchKnowledge()
      } else {
        throw new Error("Delete failed")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Knowledge Base</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upload Form */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter document name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description (optional)"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".txt,.md,.pdf,.doc,.docx"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                  required
                />
              </div>

              <Button type="submit" disabled={isUploading} className="w-full bg-blue-600 hover:bg-blue-700">
                {isUploading ? "Uploading..." : "Upload Document"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Knowledge List */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents ({knowledge.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {knowledge.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded bg-gray-50">
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-medium text-sm truncate">{item.name}</h3>
                    <p className="text-xs text-gray-500 truncate">
                      {item.fileName} • {(item.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {knowledge.length === 0 && (
                <p className="text-center text-gray-500 py-4 text-sm">No documents uploaded yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
