"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Copy, Check, CodeIcon, Wand2 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function CodeAssistant() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [language, setLanguage] = useState("javascript")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setLoading(true)
    // Simulate code generation/revision
    setTimeout(() => {
      setOutput(`// Here's the revised code
function calculateTotal(items) {
  return items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
}

// Example usage
const cart = [
  { name: 'Product 1', price: 10, quantity: 2 },
  { name: 'Product 2', price: 15, quantity: 1 },
];

const total = calculateTotal(cart);
console.log(\`Total: $\${total}\`);`)
      setLoading(false)
    }, 1500)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border shadow-lg h-[calc(100vh-120px)]">
      <CardHeader className="border-b bg-muted/40 px-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <CodeIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Code Assistant</CardTitle>
            <CardDescription>Generate, revise, and optimize code</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 overflow-auto h-[calc(100vh-220px)]">
        <div className="grid md:grid-cols-2 gap-6 h-full">
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Input</h3>
                <div className="flex gap-2">
                  <Badge variant="outline">{language}</Badge>
                  <Button type="submit" size="sm" disabled={loading || !input.trim()} className="h-8">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Processing
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-3 w-3" />
                        Revise Code
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="Enter your code or describe what you want to create..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 min-h-[300px] font-mono text-sm bg-slate-950 text-slate-50 resize-none"
              />
            </form>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Output</h3>
              {output && (
                <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-8">
                  {copied ? (
                    <>
                      <Check className="mr-2 h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-3 w-3" />
                      Copy
                    </>
                  )}
                </Button>
              )}
            </div>

            {output ? (
              <Tabs defaultValue="code" className="border rounded-lg overflow-hidden">
                <TabsList className="bg-muted border-b rounded-none">
                  <TabsTrigger value="code">Code</TabsTrigger>
                  <TabsTrigger value="explanation">Explanation</TabsTrigger>
                </TabsList>
                <TabsContent value="code" className="p-0 m-0">
                  <pre className="p-4 overflow-auto bg-slate-950 text-slate-50 rounded-b-lg max-h-[300px]">
                    <code>{output}</code>
                  </pre>
                </TabsContent>
                <TabsContent value="explanation" className="p-4 m-0 max-h-[300px] overflow-auto">
                  <p>
                    This code creates a function called <code>calculateTotal</code> that takes an array of items and
                    calculates the total price by multiplying each item's price by its quantity and summing them up. The
                    example demonstrates how to use this function with a shopping cart.
                  </p>
                </TabsContent>
              </Tabs>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center h-[300px] border rounded-lg bg-muted/30">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Processing your code...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] border rounded-lg bg-muted/30">
                <CodeIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Output will appear here</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

