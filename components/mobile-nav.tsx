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
import { Menu, Sparkles } from "lucide-react";

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Close the sheet when a tab is selected
    setOpen(false);
  };

  return (
    <div className="lg:hidden flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h1 className="font-bold">AI Assistant</h1>
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
        <TabsList>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="image">Image</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
          <TabsTrigger value="travel">Travel</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
