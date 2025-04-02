"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type AIModel = {
  id: string;
  name: string;
  provider: string;
};

type AIModelContextType = {
  currentModel: AIModel;
  setModel: (model: AIModel) => void;
};

const defaultModel: AIModel = {
  id: "gpt-4",
  name: "GPT-4",
  provider: "openai",
};

// Create the context with a default value
const AIModelContext = createContext<AIModelContextType>({
  currentModel: defaultModel,
  setModel: () => {},
});

export function AIModelProvider({ children }: { children: ReactNode }) {
  const [currentModel, setCurrentModel] = useState<AIModel>(defaultModel);

  const setModel = (model: AIModel) => {
    setCurrentModel(model);
  };

  const value = {
    currentModel,
    setModel,
  };

  return (
    <AIModelContext.Provider value={value}>{children}</AIModelContext.Provider>
  );
}

export function useAIModel() {
  const context = useContext(AIModelContext);
  if (context === undefined) {
    throw new Error("useAIModel must be used within an AIModelProvider");
  }
  return context;
}
