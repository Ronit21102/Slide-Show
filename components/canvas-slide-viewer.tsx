"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import Image from "next/image"
import type { Slide } from "@/types/slide"
import { useCanvasState } from "@/hooks/use-canvas-state"

export type DrawingTool = "pointer" | "pen" | "hand"

interface CanvasSlideViewerProps {
  slide: Slide
  tool: DrawingTool
  onToolChange: (tool: DrawingTool) => void
  zoom: number
}

export function CanvasSlideViewer({ slide, tool, onToolChange, zoom }: CanvasSlideViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  
  const { canvasRef, saveCanvasState, loadCanvasState, clearCanvasState } = useCanvasState()

  // Initialize canvas and load state
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to match container
    const container = containerRef.current
    if (container) {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }

    // Set drawing properties
    ctx.strokeStyle = "#ff0000"
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Load canvas state for current slide
    loadCanvasState(slide.id)
  }, [slide, loadCanvasState])

  // Save canvas state when slide changes
  useEffect(() => {
    return () => {
      if (slide) {
        saveCanvasState(slide.id)
      }
    }
  }, [slide.id, saveCanvasState])

  // Handle mouse events for drawing
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    if (tool === "pen") {
      setIsDrawing(true)
      setLastPoint({ x, y })
    } else if (tool === "hand") {
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }, [tool, zoom])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    if (tool === "pen" && isDrawing && lastPoint) {
      ctx.beginPath()
      ctx.moveTo(lastPoint.x, lastPoint.y)
      ctx.lineTo(x, y)
      ctx.stroke()
      setLastPoint({ x, y })
    } else if (tool === "hand" && isPanning && panStart) {
      const deltaX = e.clientX - panStart.x
      const deltaY = e.clientY - panStart.y
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }, [tool, isDrawing, isPanning, lastPoint, panStart, zoom])

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false)
    setIsPanning(false)
    setLastPoint(null)
    setPanStart(null)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsDrawing(false)
    setIsPanning(false)
    setLastPoint(null)
    setPanStart(null)
  }, [])

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    clearCanvasState(slide.id)
  }, [slide.id, clearCanvasState])

  // Get cursor style based on tool
  const getCursorStyle = () => {
    switch (tool) {
      case "pen":
        return "crosshair"
      case "hand":
        return isPanning ? "grabbing" : "grab"
      default:
        return "default"
    }
  }

  return (
    <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
      <div className="w-full h-full flex items-center justify-center">
        <div
          ref={containerRef}
          className="relative w-full h-full"
          style={{ 
            maxWidth: "min(70vw, 70vh * 16 / 9)", 
            maxHeight: "min(70vh, 70vw * 9 / 16)",
            transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: "center"
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            {slide.onlyImage && (
              <Image
                src={slide.onlyImage || ""}
                alt="Slide image"
                layout="fill"
                objectFit="contain"
                className="w-full h-full"
                draggable={false}
              />
            )}
            {slide.custom?.videos && (
              <div className="w-full h-full">
                {slide.custom.videos.map((video, index) => (
                  <video 
                    key={index} 
                    src={video.src} 
                    autoPlay 
                    loop 
                    muted 
                    className="w-full h-full object-contain"
                  />
                ))}
              </div>
            )}
            
            {/* Canvas overlay for drawing */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-auto"
              style={{ cursor: getCursorStyle() }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            />
          </div>
          
          {/* Clear canvas button */}
          {tool === "pen" && (
            <button
              onClick={clearCanvas}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm z-10"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}