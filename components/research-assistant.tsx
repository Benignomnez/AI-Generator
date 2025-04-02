"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ExternalLink, BookOpen, SearchIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

type ResearchResult = {
  title: string
  summary: string
  source: string
  url: string
  date: string
}

export default function ResearchAssistant() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ResearchResult[]>([])
  const [summary, setSummary] = useState("")

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    // Simulate research results
    setTimeout(() => {
      const mockResults: ResearchResult[] = [
        {
          title: "The Impact of AI on Modern Software Development",
          summary:
            "This paper explores how artificial intelligence is transforming software development practices, with a focus on automated testing and code generation.",
          source: "Journal of Software Engineering",
          url: "https://example.com/paper1",
          date: "2025-01-15",
        },
        {
          title: "Machine Learning Applications in Business Intelligence",
          summary:
            "A comprehensive review of how machine learning algorithms are being applied to business intelligence and analytics workflows.",
          source: "Harvard Business Review",
          url: "https://example.com/paper2",
          date: "2024-11-03",
        },
        {
          title: "Neural Networks for Natural Language Processing",
          summary:
            "This study examines recent advances in neural network architectures designed specifically for natural language processing tasks.",
          source: "MIT Technology Review",
          url: "https://example.com/paper3",
          date: "2024-09-22",
        },
      ]

      setResults(mockResults)
      setSummary(
        "Artificial intelligence is significantly impacting software development through automated testing, code generation, and quality assurance. Machine learning algorithms are being increasingly applied to business intelligence workflows, helping organizations extract insights from large datasets. Recent advances in neural network architectures have improved natural language processing capabilities, enabling more sophisticated language understanding and generation.",
      )
      setLoading(false)
    }, 2000)
  }

  return (
    <Card className="border shadow-lg h-[calc(100vh-120px)]">
      <CardHeader className="border-b bg-muted/40 px-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <SearchIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Research Assistant</CardTitle>
            <CardDescription>Find and summarize information on any topic</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 overflow-hidden h-[calc(100vh-220px)]">
        <form onSubmit={handleSearch} className="relative mb-6">
          <Input
            placeholder="Enter your research topic..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pr-24 h-12 text-base"
          />
          <Button type="submit" disabled={loading || !query.trim()} className="absolute right-1 top-1 h-10">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Researching
              </>
            ) : (
              <>
                <SearchIcon className="mr-2 h-4 w-4" />
                Research
              </>
            )}
          </Button>
        </form>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
              <div className="absolute inset-2 rounded-full bg-primary/30 animate-pulse"></div>
              <Loader2 className="absolute inset-0 m-auto h-12 w-12 animate-spin text-primary" />
            </div>
            <p className="text-muted-foreground">Searching for relevant information...</p>
          </div>
        )}

        {results.length > 0 && !loading && (
          <ScrollArea className="h-[calc(100vh-300px)]">
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="w-full max-w-md mx-auto mb-6">
                <TabsTrigger value="summary" className="flex-1">
                  Summary
                </TabsTrigger>
                <TabsTrigger value="sources" className="flex-1">
                  Sources ({results.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-0">
                <Card className="border-2 border-primary/20 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Research Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-relaxed">{summary}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sources" className="mt-0">
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <Card key={index} className="overflow-hidden transition-all hover:shadow-md">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start gap-4">
                          <CardTitle className="text-lg">{result.title}</CardTitle>
                          <Badge variant="outline" className="shrink-0">
                            {result.date}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pb-4">
                        <p>{result.summary}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{result.source}</span>
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
                            >
                              View Source
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

