import { useCallback, useEffect, useState } from "react"
import { flushSync } from "react-dom"
import { z } from "zod"
import { THEMES, type ThemeChoice } from "@/domain"

const ThemeSchema = z.enum(THEMES)
const THEME_KEY = "ruangtugas.theme.v1"
const THEME_REVEAL_DURATION = 700

export type ThemeTransitionOrigin = {
  readonly x: number
  readonly y: number
}

function loadTheme(): ThemeChoice {
  try {
    const parsed = ThemeSchema.safeParse(window.localStorage.getItem(THEME_KEY))
    return parsed.success ? parsed.data : "system"
  } catch (error: unknown) {
    if (error instanceof DOMException) return "system"
    throw error
  }
}

function applyThemeToDocument(theme: ThemeChoice, resolvedTheme: "light" | "dark"): void {
  document.documentElement.setAttribute("data-theme", theme)
  document.documentElement.classList.toggle("dark", resolvedTheme === "dark")
}

export function useThemeChoice() {
  const [theme, setTheme] = useState<ThemeChoice>(loadTheme)
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches)
  const resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const update = () => setSystemDark(media.matches)
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    applyThemeToDocument(theme, resolvedTheme)
    try {
      window.localStorage.setItem(THEME_KEY, theme)
    } catch (error: unknown) {
      if (!(error instanceof DOMException)) throw error
    }
  }, [theme, resolvedTheme])

  const setThemeFromOrigin = useCallback((nextTheme: ThemeChoice, origin: ThemeTransitionOrigin) => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduceMotion || typeof document.startViewTransition !== "function") {
      setTheme(nextTheme)
      return
    }

    const x = Math.min(Math.max(origin.x, 0), window.innerWidth)
    const y = Math.min(Math.max(origin.y, 0), window.innerHeight)
    const endRadius = Math.ceil(Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    ))
    const nextResolvedTheme = nextTheme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : nextTheme
    const transition = document.startViewTransition(() => {
      flushSync(() => setTheme(nextTheme))
      applyThemeToDocument(nextTheme, nextResolvedTheme)
    })

    void transition.ready.then(
      () => {
        const sharedOptions = {
          duration: THEME_REVEAL_DURATION,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          fill: "both",
        } satisfies KeyframeAnimationOptions
        document.documentElement.animate(
          [
            { clipPath: `circle(0px at ${x}px ${y}px)`, opacity: 1 },
            { clipPath: `circle(${endRadius}px at ${x}px ${y}px)`, opacity: 1 },
          ],
          { ...sharedOptions, pseudoElement: "::view-transition-new(root)" },
        )
      },
      () => undefined,
    )
  }, [])

  return { theme, resolvedTheme, setTheme, setThemeFromOrigin }
}
