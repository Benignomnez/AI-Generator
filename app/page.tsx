"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import AIChat from "@/components/ai-chat"
import ImageGenerator from "@/components/image-generator"
import CodeAssistant from "@/components/code-assistant"
import ResearchAssistant from "@/components/research-assistant"
import TravelGuide from "@/components/travel-guide"

export default function Home() {
  // Shared tab state that will be used by both sidebar and content
  const [activeTab, setActiveTab] = useState("chat")

  return (
    <div className="flex h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Sidebar for desktop */}
      <Sidebar className="hidden lg:flex" activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main content */}
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        {/* Mobile navigation */}
        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Tabs value={activeTab} className="w-full h-full">
            <TabsContent value="chat" className="mt-0 h-full">
              <AIChat />
            </TabsContent>

            <TabsContent value="image" className="mt-0 h-full">
              <ImageGenerator />
            </TabsContent>

            <TabsContent value="code" className="mt-0 h-full">
              <CodeAssistant />
            </TabsContent>

            <TabsContent value="research" className="mt-0 h-full">
              <ResearchAssistant />
            </TabsContent>

            <TabsContent value="travel" className="mt-0 h-full">
              <TravelGuide />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}

