"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/sidebar";
import {
  Menu,
  Sparkles,
  MessageSquare,
  Image,
  Code,
  Search,
  Map,
} from "lucide-react";

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const tabs = [
    {
      id: "chat",
      label: "Chat",
      icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      id: "image",
      label: "Image",
      icon: <Image className="h-4 w-4" />,
    },
    {
      id: "code",
      label: "Code",
      icon: <Code className="h-4 w-4" />,
    },
    {
      id: "research",
      label: "Research",
      icon: <Search className="h-4 w-4" />,
    },
    {
      id: "travel",
      label: "Travel",
      icon: <Map className="h-4 w-4" />,
    },
  ];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Close the sheet when a tab is selected
    setOpen(false);
  };

  return (
    <div className="lg:hidden flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h1 className="font-bold">VecinoAI</h1>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[280px]">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
        </SheetContent>
      </Sheet>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="hidden sm:block"
      >
        <TabsList className="overflow-hidden">
          {tabs.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className="flex items-center gap-1"
            >
              <div className="flex-shrink-0">{item.icon}</div>
              <span className="truncate">{item.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
