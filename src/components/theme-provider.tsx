"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
        {...props}
        attribute="data-theme"
        themes={['light', 'dark', 'ocean', 'forest', 'sunset', 'mint', 'matrix', 'rose', 'premium', 'ultra', 'system']}
    >
        {children}
    </NextThemesProvider>
  )
}

    