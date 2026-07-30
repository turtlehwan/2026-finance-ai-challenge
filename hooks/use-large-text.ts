"use client"

import { useEffect, useSyncExternalStore } from "react"

const STORAGE_KEY = "claim-guide-preferences:v1"

type Preferences = {
  largeText: boolean
}

function readPreferences(): Preferences {
  if (typeof window === "undefined") {
    return { largeText: false }
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as Preferences) : { largeText: false }
  } catch {
    return { largeText: false }
  }
}

const CHANGE_EVENT = "claim-guide-preferences-change"

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)
  window.addEventListener(CHANGE_EVENT, onStoreChange)
  return () => {
    window.removeEventListener("storage", onStoreChange)
    window.removeEventListener(CHANGE_EVENT, onStoreChange)
  }
}

function getSnapshot() {
  return readPreferences().largeText
}

function getServerSnapshot() {
  return false
}

export function useLargeText() {
  const largeText = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )

  useEffect(() => {
    document.documentElement.dataset.textSize = largeText ? "large" : "normal"
  }, [largeText])

  const setLargeText = (next: boolean) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ largeText: next } satisfies Preferences),
      )
      window.dispatchEvent(new Event(CHANGE_EVENT))
    } catch {
      document.documentElement.dataset.textSize = next ? "large" : "normal"
    }
  }

  return {
    largeText,
    setLargeText,
  }
}
