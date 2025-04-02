"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Loader2, Download, RefreshCw, Sparkles, ImageIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [style, setStyle] = useState("realistic")
  const [size, setSize] = useState("1024x1024")
  const [count, setCount] = useState(1)
  const [activeTab, setActiveTab] = useState("prompt")

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt) return

    setLoading(true)
    // Simulate image generation
    setTimeout(() => {
      // Generate placeholder images
      const newImages = Array(count)
        .fill(0)
        .map((_, i) => `/placeholder.svg?height=512&width=512`)
      setImages(newImages)
      setLoading(false)
    }, 2000)
  }

  return (
    <Card className="border shadow-lg h-[calc(100vh-120px)]">
      <CardHeader className="border-b bg-muted/40 px-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Image Generator</CardTitle>
            <CardDescription>Create images from text descriptions</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 overflow-auto h-[calc(100vh-220px)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-2 w-full max-w-[400px]">
            <TabsTrigger value="prompt">Text Prompt</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "prompt" ? (
          <div className="space-y-6">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Input
                    placeholder="Describe the image you want to generate..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full pr-24 h-12 text-base"
                  />
                  <Button type="submit" disabled={loading || !prompt} className="absolute right-1 top-1 h-10">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {loading && (
              <div className="flex flex-col justify-center items-center py-12 space-y-4">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
                  <div className="absolute inset-2 rounded-full bg-primary/30 animate-pulse"></div>
                  <Loader2 className="absolute inset-0 m-auto h-12 w-12 animate-spin text-primary" />
                </div>
                <p className="text-muted-foreground">Creating your masterpiece...</p>
              </div>
            )}

            {images.length > 0 && !loading && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Generated Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {images.map((src, index) => (
                    <Card key={index} className="overflow-hidden group">
                      <CardContent className="p-0 relative">
                        <img
                          src={src || "/placeholder.svg"}
                          alt={`Generated image ${index + 1}`}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <Button size="sm" variant="secondary" className="h-9">
                            <Download className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button size="sm" variant="secondary" className="h-9">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base">Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realistic">Realistic</SelectItem>
                    <SelectItem value="cartoon">Cartoon</SelectItem>
                    <SelectItem value="3d">3D Render</SelectItem>
                    <SelectItem value="sketch">Sketch</SelectItem>
                    <SelectItem value="painting">Painting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-base">Size</Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1024x1024">1024x1024</SelectItem>
                    <SelectItem value="512x512">512x512</SelectItem>
                    <SelectItem value="1024x512">1024x512</SelectItem>
                    <SelectItem value="512x1024">512x1024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-base">Number of images: {count}</Label>
                </div>
                <Slider
                  value={[count]}
                  min={1}
                  max={4}
                  step={1}
                  onValueChange={(value) => setCount(value[0])}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={() => setActiveTab("prompt")} className="w-full h-11">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Apply & Generate
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

