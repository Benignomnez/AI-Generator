"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Using a client-only flag helps prevent hydration issues
  const [mounted, setMounted] = React.useState(false);

  // After mounting, we have access to the theme
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // The wrapper div is needed to prevent layout shift
  // during hydration since we're not showing the children when not mounted
  return (
    <NextThemesProvider {...props}>
      <div style={{ visibility: mounted ? "visible" : "hidden" }}>
        {children}
      </div>
    </NextThemesProvider>
  );
}
