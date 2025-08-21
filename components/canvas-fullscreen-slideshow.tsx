"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { Inter } from "next/font/google"
import type { Slide } from "@/types/slide"
import type { DrawingTool } from "./canvas-slide-viewer"

const inter = Inter({ subsets: ["latin"] })

interface CanvasFullscreenSlideshowProps {
  slide: Slide
  isVisible: boolean
  showSlide: boolean
  fullscreenRef: React.RefObject<HTMLDivElement>
  onNextSlide: () => void
  tool: DrawingTool
  onToolChange: (tool: DrawingTool) => void
}

export function CanvasFullscreenSlideshow({
  slide,
  isVisible,
  showSlide,
  fullscreenRef,
  onNextSlide,
  tool,
  onToolChange,
}: CanvasFullscreenSlideshowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })

  // Initialize canvas
  useEffect(() => {
    if (!isVisible) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to match screen
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Set drawing properties
    ctx.strokeStyle = "#ff0000"
    ctx.lineWidth = 4
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [slide, isVisible])

  // Handle mouse events for drawing
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (tool === "pointer") {
      onNextSlide()
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (tool === "pen") {
      setIsDrawing(true)
      setLastPoint({ x, y })
    } else if (tool === "hand") {
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }, [tool, onNextSlide])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

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
  }, [tool, isDrawing, isPanning, lastPoint, panStart])

  const handleMouseUp = useCallback(() => {
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
  }, [])

  // Get cursor style based on tool
  const getCursorStyle = () => {
    switch (tool) {
      case "pen":
        return "crosshair"
      case "hand":
        return isPanning ? "grabbing" : "grab"
      default:
        return "none"
    }
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return
      
      if (e.key === "p" || e.key === "P") {
        onToolChange("pen")
      } else if (e.key === "h" || e.key === "H") {
        onToolChange("hand")
      } else if (e.key === "c" || e.key === "C") {
        clearCanvas()
      } else if (e.key === "r" || e.key === "R") {
        setPanOffset({ x: 0, y: 0 })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isVisible, onToolChange, clearCanvas])

  if (!isVisible) return null

  return (
    <div
      ref={fullscreenRef}
      className={`${inter.className} fixed inset-0 bg-black z-50 flex items-center justify-center`}
      style={{ cursor: tool === "pointer" ? "none" : "default" }}
    >
      <div
        className={`relative w-screen h-screen flex items-center justify-center overflow-hidden transition-opacity duration-300 ${showSlide ? "opacity-100" : "opacity-0"}`}
      >
        <div 
          ref={containerRef}
          className="relative w-full h-full" 
          style={{ 
            maxWidth: "177.78vh", 
            maxHeight: "56.25vw",
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`
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
                quality={75}
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
          </div>
        </div>

        {/* Canvas overlay for drawing */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ cursor: getCursorStyle() }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Tool indicator */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded flex items-center space-x-2">
          <span className="text-sm">
            Tool: {tool === "pointer" ? "Pointer" : tool === "pen" ? "Pen" : "Pan"}
          </span>
          <div className="text-xs opacity-75">
            <div>P = Pen | H = Hand | C = Clear | R = Reset Pan</div>
          </div>
        </div>

        {/* Clear button for pen tool */}
        {tool === "pen" && (
          <button
            onClick={clearCanvas}
            className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
          >
            Clear Canvas
          </button>
        )}
      </div>
    </div>
  )
}