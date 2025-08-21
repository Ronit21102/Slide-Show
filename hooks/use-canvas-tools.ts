"use client"

import { useState, useCallback } from "react"
import type { DrawingTool } from "@/components/canvas-slide-viewer"

export function useCanvasTools() {
  const [tool, setTool] = useState<DrawingTool>("pointer")
  const [zoom, setZoom] = useState<number>(1)

  const changeTool = useCallback((newTool: DrawingTool) => {
    setTool(newTool)
  }, [])

  const changeZoom = useCallback((newZoom: number) => {
    setZoom(Math.max(0.1, Math.min(3, newZoom)))
  }, [])

  const resetZoom = useCallback(() => {
    setZoom(1)
  }, [])

  return {
    tool,
    zoom,
    changeTool,
    changeZoom,
    resetZoom,
  }
}