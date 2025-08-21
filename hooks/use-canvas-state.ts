"use client"

import { useState, useCallback, useRef } from "react"

export interface CanvasState {
  slideId: number
  imageData: string | null
}

export function useCanvasState() {
  const [canvasStates, setCanvasStates] = useState<Map<number, string>>(new Map())
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const saveCanvasState = useCallback((slideId: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const imageData = canvas.toDataURL()
    setCanvasStates(prev => new Map(prev.set(slideId, imageData)))
  }, [])

  const loadCanvasState = useCallback((slideId: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear the canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const imageData = canvasStates.get(slideId)
    if (imageData) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
      }
      img.src = imageData
    }
  }, [canvasStates])

  const clearCanvasState = useCallback((slideId: number) => {
    setCanvasStates(prev => {
      const newStates = new Map(prev)
      newStates.delete(slideId)
      return newStates
    })
  }, [])

  const clearAllCanvasStates = useCallback(() => {
    setCanvasStates(new Map())
  }, [])

  return {
    canvasRef,
    saveCanvasState,
    loadCanvasState,
    clearCanvasState,
    clearAllCanvasStates,
    hasCanvasState: (slideId: number) => canvasStates.has(slideId),
  }
}