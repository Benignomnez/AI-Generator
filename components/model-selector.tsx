"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAIModel } from "@/hooks/use-ai-model";

const models = [
  { value: "gpt-4o", label: "OpenAI GPT-4o", icon: "✨", provider: "openai" },
  { value: "gpt-4", label: "OpenAI GPT-4", icon: "🧠", provider: "openai" },
  {
    value: "gpt-3.5-turbo",
    label: "OpenAI GPT-3.5",
    icon: "🚀",
    provider: "openai",
  },
  {
    value: "gemini-2.0-flash",
    label: "Google Gemini Flash 2.0",
    icon: "⚡",
    provider: "google",
  },
];

export function ModelSelector() {
  const { currentModel, setModel } = useAIModel();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentModel.id);

  const handleModelSelect = (modelValue: string) => {
    setValue(modelValue);
    const selectedModel = models.find((model) => model.value === modelValue);
    if (selectedModel) {
      setModel({
        id: selectedModel.value,
        name: selectedModel.label,
        provider: selectedModel.provider,
      });
    }
    setOpen(false);
  };

  const selectedModel = models.find((model) => model.value === value);

  return (
    <div className="flex flex-col gap-2 w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between overflow-hidden"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg flex-shrink-0">
                {selectedModel?.icon}
              </span>
              <span className="truncate">
                {selectedModel?.label || "Select model..."}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 flex-shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search models..." />
            <CommandList>
              <CommandEmpty>No model found.</CommandEmpty>
              <CommandGroup>
                {models.map((model) => (
                  <CommandItem
                    key={model.value}
                    value={model.value}
                    onSelect={handleModelSelect}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{model.icon}</span>
                      {model.label}
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === model.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
