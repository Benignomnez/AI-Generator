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
            width="fit"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between overflow-hidden max-w-full"
            style={{ maxWidth: "100%", boxSizing: "border-box" }}
          >
            <div className="flex items-center gap-2 min-w-0 max-w-[calc(100%-20px)]">
              <span className="text-lg flex-shrink-0">
                {selectedModel?.icon}
              </span>
              <span className="truncate">
                {selectedModel?.label || "Select model..."}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[200px] p-0 max-w-[200px]"
          style={{ width: "200px", maxWidth: "200px" }}
        >
          <Command className="max-w-full">
            <CommandInput
              placeholder="Search models..."
              className="max-w-full"
            />
            <CommandList>
              <CommandEmpty>No model found.</CommandEmpty>
              <CommandGroup>
                {models.map((model) => (
                  <CommandItem
                    key={model.value}
                    value={model.value}
                    onSelect={handleModelSelect}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0 max-w-[80%] overflow-hidden">
                      <span className="text-lg flex-shrink-0">
                        {model.icon}
                      </span>
                      <span className="truncate max-w-[120px]">
                        {model.label}
                      </span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4 flex-shrink-0",
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
