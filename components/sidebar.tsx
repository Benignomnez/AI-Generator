"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ModelSelector } from "@/components/model-selector"
import { MessageSquare, Image, Code, Search, Map, Settings, Sparkles } from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function Sidebar({ className, activeTab, setActiveTab }: SidebarProps) {
  const pathname = usePathname()

  const tabs = [
    {
      id: "chat",
      label: "Chat",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      id: "image",
      label: "Image",
      icon: <Image className="h-5 w-5" />,
    },
    {
      id: "code",
      label: "Code",
      icon: <Code className="h-5 w-5" />,
    },
    {
      id: "research",
      label: "Research",
      icon: <Search className="h-5 w-5" />,
    },
    {
      id: "travel",
      label: "Travel",
      icon: <Map className="h-5 w-5" />,
    },
  ]

  return (
    <div className={cn("pb-12 w-[220px] border-r bg-background/95 backdrop-blur", className)}>
      <div className="flex flex-col h-full">
        <div className="py-6 px-5 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">AI Assistant</h1>
        </div>

        <Separator />

        <ScrollArea className="flex-1 py-4">
          <div className="px-3 space-y-1">
            {tabs.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                size="lg"
                className={cn("w-full justify-start gap-3 font-normal", activeTab === item.id && "font-medium")}
                onClick={() => setActiveTab(item.id)}
              >
                {item.icon}
                {item.label}
              </Button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 mt-auto">
          <ModelSelector />

          <Button variant="outline" size="lg" className="w-full mt-4 gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  )
}

