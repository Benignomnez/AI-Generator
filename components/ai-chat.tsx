"use client";

import { DialogTrigger } from "@/components/ui/dialog";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import {
  SendHorizontal,
  Paperclip,
  Mic,
  Bot,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAIModel } from "@/hooks/use-ai-model";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { v4 as uuidv4 } from "uuid";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

export default function AIChat() {
  const { currentModel } = useAIModel();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State for messages and loading
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      role: "assistant",
      content: "Hello! I'm your AI assistant. How can I help you today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Direct implementation of chat functionality
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    setError(null);

    // Add user message to the chat
    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare the messages for the API
      const messagesToSend = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Make the API request
      const response = await fetch("/api/chat-direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messagesToSend,
          model: currentModel.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to get a response from the AI"
        );
      }

      const data = await response.json();

      // Add the AI response to the chat
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content:
            data.content || "I couldn't generate a response. Please try again.",
        },
      ]);
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError(
        err.message || "An error occurred while communicating with the AI"
      );
      toast({
        title: "Error",
        description: err.message || "Failed to get a response from the AI",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const currentInput = input;
    setInput("");
    await sendMessage(currentInput);
  };

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <CardTitle>AI Chat</CardTitle>
        </div>
        <CardDescription>
          Chat with {currentModel.name} about anything
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col gap-4 p-4">
        {/* Error display */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Chat messages */}
        <ScrollArea className="flex-1 pr-4">
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <Avatar className="mt-1">
                    {message.role === "user" ? (
                      <div className="bg-primary text-primary-foreground rounded-full w-full h-full flex items-center justify-center text-xs">
                        You
                      </div>
                    ) : (
                      <div className="bg-muted text-muted-foreground rounded-full w-full h-full flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                  </Avatar>
                  <div
                    className={`rounded-lg p-3 text-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <Avatar className="mt-1">
                    <div className="bg-muted text-muted-foreground rounded-full w-full h-full flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                  </Avatar>
                  <div className="rounded-lg p-3 text-sm bg-muted text-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              placeholder="Type your message..."
              className="resize-none pr-10"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="absolute right-3 bottom-2 flex gap-2">
              <button
                type="button"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Mic className="h-4 w-4" />
              </button>
            </div>
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
