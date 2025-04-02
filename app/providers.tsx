"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { AIModelProvider } from "@/hooks/use-ai-model";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <AIModelProvider>{children}</AIModelProvider>
    </ThemeProvider>
  );
}
